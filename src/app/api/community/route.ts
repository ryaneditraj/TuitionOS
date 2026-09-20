import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { user } = await getCurrentUser();
    const db = getDb();

    // Query posts: exclude HIDDEN posts unless user is admin
    let query = `
      SELECT cp.*,
             CASE WHEN cp.is_anonymous = 1 THEN 'Anonymous Student' ELSE u.full_name END as author_name,
             u.avatar_url as author_avatar,
             ru.full_name as responded_by_name,
             (SELECT count(*) FROM community_votes cv WHERE cv.post_id = cp.id) as votes_count
      FROM community_posts cp
      LEFT JOIN users u ON cp.author_id = u.id
      LEFT JOIN users ru ON cp.responded_by = ru.id
    `;

    if (!user || !['super_admin', 'batch_admin'].includes(user.role)) {
      query += ` WHERE cp.status != 'HIDDEN'`;
    }

    query += ` ORDER BY votes_count DESC, cp.created_at DESC`;

    const rawPosts = db.prepare(query).all() as any[];

    // Check if current user has voted on each
    const posts = rawPosts.map(p => {
      let hasVoted = false;
      if (user?.id) {
        const v = db.prepare('SELECT 1 FROM community_votes WHERE post_id = ? AND user_id = ?').get(p.id, user.id);
        hasVoted = !!v;
      }
      return {
        ...p,
        is_anonymous: Boolean(p.is_anonymous),
        votes_count: p.votes_count || 0,
        has_voted: hasVoted,
      };
    });

    return Response.json({ posts });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, is_anonymous } = body;

    if (!title || !description) {
      return Response.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const db = getDb();
    const id = `cp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO community_posts (
        id, author_id, is_anonymous, title, description, category, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?)
    `).run(
      id,
      user.id,
      is_anonymous ? 1 : 0,
      title,
      description,
      category || 'General Idea',
      now
    );

    // Initial vote by the author
    db.prepare(`INSERT OR IGNORE INTO community_votes (post_id, user_id, created_at) VALUES (?, ?, ?)`).run(id, user.id, now);

    return Response.json({ success: true, id });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { user } = await getCurrentUser();
    if (!user || !['super_admin', 'batch_admin'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized to moderate community posts' }, { status: 403 });
    }

    const body = await request.json();
    const { id, admin_response, status } = body;

    if (!id) {
      return Response.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE community_posts
      SET admin_response = COALESCE(?, admin_response),
          responded_by = CASE WHEN ? IS NOT NULL THEN ? ELSE responded_by END,
          responded_at = CASE WHEN ? IS NOT NULL THEN ? ELSE responded_at END,
          status = COALESCE(?, status)
      WHERE id = ?
    `).run(
      admin_response || null,
      admin_response,
      user.id,
      admin_response,
      now,
      status || null,
      id
    );

    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

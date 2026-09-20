import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getCurrentUser();
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const postId = params.id;
    const db = getDb();

    // Check if already voted
    const existing = db.prepare('SELECT 1 FROM community_votes WHERE post_id = ? AND user_id = ?').get(postId, user.id);

    let hasVoted = false;
    if (existing) {
      // Remove vote
      db.prepare('DELETE FROM community_votes WHERE post_id = ? AND user_id = ?').run(postId, user.id);
      hasVoted = false;
    } else {
      // Add vote
      db.prepare('INSERT INTO community_votes (post_id, user_id, created_at) VALUES (?, ?, ?)').run(
        postId,
        user.id,
        new Date().toISOString()
      );
      hasVoted = true;
    }

    const voteCountRow = db.prepare('SELECT count(*) as count FROM community_votes WHERE post_id = ?').get(postId) as { count: number };

    return Response.json({
      success: true,
      has_voted: hasVoted,
      votes_count: voteCountRow.count,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

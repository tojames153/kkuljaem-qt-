'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Reflection, ReactionType } from '@/types';
import { useAuth } from '@/lib/auth-context';

interface CommunityPost extends Reflection {
  user_name?: string;
  reactions: Record<ReactionType, number>;
  myReaction?: ReactionType;
}

// [Q][A] 포맷을 유연하게 파싱 (줄바꿈 유무 상관없이)
function parseQA(text: string): { q: string; a: string }[] {
  const results: { q: string; a: string }[] = [];

  // 패턴: [Q] ... [A] ... 반복
  const regex = /\[Q\]\s*([\s\S]*?)\[A\]\s*([\s\S]*?)(?=\[Q\]|$)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const q = match[1].trim();
    const a = match[2].trim();
    if (q && a) results.push({ q, a });
  }

  return results;
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filter, setFilter] = useState<'all' | 'group' | 'church'>('all');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadPosts();
  }, [user]);

  async function loadPosts() {
    setLoading(true);
    const allPosts: CommunityPost[] = [];
    const seenIds = new Set<string>();

    const savedReactions = localStorage.getItem('kkuljaem-community-reactions');
    const reactionsMap: Record<string, { reactions: Record<ReactionType, number>; myReaction?: ReactionType }> =
      savedReactions ? JSON.parse(savedReactions) : {};

    // 1. 서버에서 공유 묵상 가져오기
    try {
      const res = await fetch('/api/shared-reflections?limit=50');
      const data = await res.json();
      if (data.reflections) {
        for (const r of data.reflections) {
          if (!seenIds.has(r.id)) {
            seenIds.add(r.id);
            allPosts.push({
              ...r,
              user: { name: r.user_name || '익명' },
              reactions: reactionsMap[r.id]?.reactions || { pray: 0, empathy: 0, grace: 0 },
              myReaction: reactionsMap[r.id]?.myReaction,
            });
          }
        }
      }
    } catch {
      // 서버 실패 시 localStorage 폴백
    }

    // 2. 내 localStorage에서 공유된 묵상도 추가 (서버에 아직 없을 수 있음)
    try {
      const stored = localStorage.getItem('kkuljaem-reflections');
      if (stored) {
        const reflections: Reflection[] = JSON.parse(stored);
        for (const r of reflections) {
          if (r.visibility !== 'private' && !seenIds.has(r.id)) {
            seenIds.add(r.id);
            allPosts.push({
              ...r,
              user: { name: user?.name || '나' },
              reactions: reactionsMap[r.id]?.reactions || { pray: 0, empathy: 0, grace: 0 },
              myReaction: reactionsMap[r.id]?.myReaction,
            });
          }
        }
      }
    } catch {
      // 무시
    }

    // 최신순 정렬
    allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setPosts(allPosts);
    setLoading(false);
  }

  const handleReaction = (postId: string, type: ReactionType) => {
    setPosts((prev) => {
      const updated = prev.map((post) => {
        if (post.id !== postId) return post;
        const wasSelected = post.myReaction === type;
        return {
          ...post,
          myReaction: wasSelected ? undefined : type,
          reactions: {
            ...post.reactions,
            [type]: post.reactions[type] + (wasSelected ? -1 : 1),
            ...(post.myReaction && post.myReaction !== type
              ? { [post.myReaction]: post.reactions[post.myReaction] - 1 }
              : {}),
          },
        };
      });

      const reactionsMap: Record<string, { reactions: Record<ReactionType, number>; myReaction?: ReactionType }> = {};
      updated.forEach((p) => {
        reactionsMap[p.id] = { reactions: p.reactions, myReaction: p.myReaction };
      });
      localStorage.setItem('kkuljaem-community-reactions', JSON.stringify(reactionsMap));

      return updated;
    });
  };

  const reactionConfig: Record<ReactionType, { emoji: string; label: string }> = {
    pray: { emoji: '🙏', label: '기도합니다' },
    empathy: { emoji: '💛', label: '공감합니다' },
    grace: { emoji: '📖', label: '말씀 은혜' },
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  const filteredPosts = posts.filter((p) => {
    if (filter === 'group') return p.visibility === 'group';
    if (filter === 'church') return p.visibility === 'church';
    return true;
  });

  return (
    <AppShell>
      <div className="pt-4 space-y-5">
        <div className="animate-fade-in">
          <h2 className="text-lg font-bold text-brown">함께하는 묵상</h2>
          <p className="text-sm text-stone-400 mt-0.5">교회 공동체의 묵상을 나눠보세요</p>
        </div>

        <div className="flex bg-cream rounded-xl p-1 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {(['all', 'group', 'church'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f ? 'bg-white text-brown shadow-sm' : 'text-stone-400'
              }`}
            >
              {f === 'all' ? '전체' : f === 'group' ? '내 소그룹' : '내 교회'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-6 h-6 border-2 border-amber-300 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-stone-400 text-sm mt-3">불러오는 중...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <span className="text-5xl block mb-4">🌿</span>
              <p className="text-stone-400 font-medium">아직 공유된 묵상이 없어요</p>
              <p className="text-stone-300 text-sm mt-1">묵상 기록에서 &apos;소그룹&apos; 또는 &apos;교회 전체&apos;로 공개해보세요!</p>
            </div>
          ) : (
            filteredPosts.map((post, i) => {
              const parsed = parseQA(post.reflection_text);
              const hasQA = parsed.length > 0;

              return (
                <div
                  key={post.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50 animate-fade-in"
                  style={{ animationDelay: `${0.05 * (i + 1)}s` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-honey/20 rounded-full flex items-center justify-center text-sm font-bold text-amber-700">
                      {(post.user?.name || '?').charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-brown">{post.user?.name || '익명'}</p>
                      <p className="text-xs text-stone-400">{timeAgo(post.created_at)}</p>
                    </div>
                    <span className="text-xs bg-cream px-2 py-0.5 rounded-full text-stone-500">
                      {post.visibility === 'church' ? '⛪ 교회' : '👥 소그룹'}
                    </span>
                  </div>

                  {/* 묵상 내용 */}
                  <div className="mb-4">
                    {hasQA ? (
                      <div className="space-y-3">
                        {parsed.map((pair, idx) => (
                          <div key={idx} className="bg-amber-50/50 rounded-xl p-3.5">
                            <p className="text-xs font-semibold text-amber-600 mb-1.5 flex items-center gap-1.5">
                              <span className="w-5 h-5 bg-honey/20 rounded-full flex items-center justify-center text-[10px] font-bold text-amber-700 shrink-0">{idx + 1}</span>
                              {pair.q}
                            </p>
                            <p className="text-[15px] text-stone-700 leading-relaxed pl-6.5">{pair.a}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[15px] text-stone-700 leading-relaxed whitespace-pre-wrap">{post.reflection_text}</p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-amber-50">
                    {(Object.keys(reactionConfig) as ReactionType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => handleReaction(post.id, type)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all ${
                          post.myReaction === type
                            ? 'bg-honey/20 text-amber-700 border border-honey/30'
                            : 'bg-stone-50 text-stone-500 hover:bg-amber-50'
                        }`}
                      >
                        <span>{reactionConfig[type].emoji}</span>
                        <span>{post.reactions[type]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}

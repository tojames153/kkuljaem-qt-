'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Reflection, ReactionType } from '@/types';
import { useAuth } from '@/lib/auth-context';

interface CommunityPost extends Reflection {
  reactions: Record<ReactionType, number>;
  myReaction?: ReactionType;
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filter, setFilter] = useState<'all' | 'group' | 'church'>('all');
  const { user } = useAuth();

  useEffect(() => {
    // localStorage에서 공개된 묵상 기록 불러오기
    const loadPosts = () => {
      const stored = localStorage.getItem('kkuljaem-reflections');
      const savedReactions = localStorage.getItem('kkuljaem-community-reactions');
      const reactionsMap: Record<string, { reactions: Record<ReactionType, number>; myReaction?: ReactionType }> =
        savedReactions ? JSON.parse(savedReactions) : {};

      if (stored) {
        const reflections: Reflection[] = JSON.parse(stored);
        // 공개 설정된 묵상만 표시 (group 또는 church)
        const publicPosts: CommunityPost[] = reflections
          .filter((r) => r.visibility !== 'private')
          .map((r) => ({
            ...r,
            user: { name: user?.name || '나' },
            reactions: reactionsMap[r.id]?.reactions || { pray: 0, empathy: 0, grace: 0 },
            myReaction: reactionsMap[r.id]?.myReaction,
          }));
        setPosts(publicPosts);
      }
    };
    loadPosts();
  }, [user]);

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

      // 반응 상태 저장
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
        {/* 헤더 */}
        <div className="animate-fade-in">
          <h2 className="text-lg font-bold text-brown">함께하는 묵상</h2>
          <p className="text-sm text-stone-400 mt-0.5">교회 공동체의 묵상을 나눠보세요</p>
        </div>

        {/* 필터 */}
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

        {/* 게시물 목록 */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <span className="text-5xl block mb-4">🌿</span>
              <p className="text-stone-400 font-medium">아직 공유된 묵상이 없어요</p>
              <p className="text-stone-300 text-sm mt-1">묵상 기록에서 &apos;소그룹&apos; 또는 &apos;교회 전체&apos;로 공개해보세요!</p>
            </div>
          ) : (
            filteredPosts.map((post, i) => (
              <div
                key={post.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50 animate-fade-in"
                style={{ animationDelay: `${0.1 * (i + 1)}s` }}
              >
                {/* 사용자 정보 */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-honey/20 rounded-full flex items-center justify-center text-sm font-bold text-amber-700">
                    {post.user?.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-brown">{post.user?.name}</p>
                    <p className="text-xs text-stone-400">{timeAgo(post.created_at)}</p>
                  </div>
                  <span className="text-xs bg-cream px-2 py-0.5 rounded-full text-stone-500">
                    {post.visibility === 'church' ? '⛪ 교회' : '👥 소그룹'}
                  </span>
                </div>

                {/* 묵상 내용 */}
                <p className="text-[15px] text-stone-700 leading-relaxed mb-4">
                  {post.reflection_text}
                </p>

                {/* 반응 버튼 */}
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
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}

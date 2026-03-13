'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Reflection, ReactionType } from '@/types';

interface CommunityPost extends Reflection {
  reactions: Record<ReactionType, number>;
  myReaction?: ReactionType;
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filter, setFilter] = useState<'all' | 'group' | 'church'>('all');

  useEffect(() => {
    // 데모 공동체 데이터
    const demoPosts: CommunityPost[] = [
      {
        id: '1',
        user_id: 'user-1',
        devotional_id: 'dev-1',
        reflection_text:
          '오늘 말씀을 통해 하나님이 어둠 속에서도 함께하신다는 것을 다시 한번 느꼈습니다. 요즘 힘든 일이 있었는데, 이 말씀이 큰 위로가 되었어요.',
        visibility: 'church',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date().toISOString(),
        user: { name: '은혜' },
        reactions: { pray: 5, empathy: 3, grace: 2 },
      },
      {
        id: '2',
        user_id: 'user-2',
        devotional_id: 'dev-1',
        reflection_text:
          '빛을 기다린다는 것은 소극적인 것이 아니라, 하나님을 신뢰하는 적극적인 행위라는 것을 깨달았습니다. 기다림 속에서도 하나님은 일하고 계세요!',
        visibility: 'church',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date().toISOString(),
        user: { name: '빛나리' },
        reactions: { pray: 8, empathy: 6, grace: 4 },
      },
      {
        id: '3',
        user_id: 'user-3',
        devotional_id: 'dev-1',
        reflection_text:
          '이사야 9:2 말씀처럼, 우리 학교에서도 빛이 되고 싶어요. 친구들에게 좋은 영향을 줄 수 있는 사람이 되기를 기도합니다.',
        visibility: 'group',
        created_at: new Date(Date.now() - 10800000).toISOString(),
        updated_at: new Date().toISOString(),
        user: { name: '소망이' },
        reactions: { pray: 12, empathy: 4, grace: 7 },
      },
      {
        id: '4',
        user_id: 'user-4',
        devotional_id: 'dev-1',
        reflection_text:
          '매일 묵상하면서 하나님과의 관계가 더 깊어지는 것 같아요. 꿀잼QT 덕분에 꾸준히 할 수 있어서 감사합니다.',
        visibility: 'church',
        created_at: new Date(Date.now() - 14400000).toISOString(),
        updated_at: new Date().toISOString(),
        user: { name: '하늘' },
        reactions: { pray: 3, empathy: 9, grace: 5 },
      },
    ];
    setPosts(demoPosts);
  }, []);

  const handleReaction = (postId: string, type: ReactionType) => {
    setPosts((prev) =>
      prev.map((post) => {
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
      })
    );
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
          {filteredPosts.map((post, i) => (
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
          ))}
        </div>
      </div>
    </AppShell>
  );
}

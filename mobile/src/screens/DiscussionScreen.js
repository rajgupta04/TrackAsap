import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform, Alert, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useDiscussionStore from '../context/discussionStore';
import useAuthStore from '../context/authStore';
import useSheetStore from '../context/sheetStore';
import useThemeStore from '../context/themeStore';
import UserAgreementModal from '../components/UserAgreementModal';
import { formatDistanceToNow } from 'date-fns';
import discussionService from '../services/discussionService';

const DiscussionScreen = () => {
  const colors = useThemeStore((state) => state.colors);
  const { user } = useAuthStore();
  const { posts, pagination, isLoading, fetchPosts, createPost, likePost, addComment, deletePost, cloneSheet } = useDiscussionStore();
  const { sheets, fetchSheets } = useSheetStore();

  const [content, setContent] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [isPosting, setIsPosting] = useState(false);

  // Sheet Picker State
  const [showSheetPicker, setShowSheetPicker] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState(null);

  useEffect(() => {
    fetchPosts(1);
    fetchSheets(true); // silent fetch
  }, []);

  useEffect(() => {
    if (user && !user.acceptedDiscussionAgreement) {
      setShowAgreement(true);
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts(1);
    setRefreshing(false);
  };

  const handleAcceptAgreement = async () => {
    try {
      await discussionService.acceptAgreement();
      useAuthStore.getState().updateUser({ ...user, acceptedDiscussionAgreement: true });
      setShowAgreement(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to accept agreement');
    }
  };

  const handleDeclineAgreement = () => {
    setShowAgreement(false);
    Alert.alert('Notice', 'You must accept the community guidelines to post or comment.');
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    if (!user?.acceptedDiscussionAgreement) {
      setShowAgreement(true);
      return;
    }
    
    setIsPosting(true);
    const result = await createPost(content.trim(), selectedSheet);
    setIsPosting(false);

    if (result.success) {
      setContent('');
      setSelectedSheet(null);
    } else if (result.requiresAgreement) {
      setShowAgreement(true);
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleComment = async (postId) => {
    const commentContent = commentInputs[postId];
    if (!commentContent?.trim()) return;

    const result = await addComment(postId, commentContent.trim());
    if (result.success) {
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const toggleComments = (postId) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const isLikedByMe = (post) => {
    return post.likes?.some((id) => id === user?._id || id === 'current-user');
  };

  const renderSheetAttachment = () => {
    if (!selectedSheet) return null;
    const sheet = sheets.find(s => s._id === selectedSheet);
    if (!sheet) return null;

    const pct = sheet.totalProblems ? Math.round((sheet.solvedProblems / sheet.totalProblems) * 100) : 0;
    const color = sheet.color || colors.primary;

    return (
      <View style={styles(colors).attachedSheet}>
        <View style={styles(colors).attachedHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="book" size={14} color={color} />
            <Text style={styles(colors).attachedTitle}>{sheet.name}</Text>
          </View>
          <TouchableOpacity onPress={() => setSelectedSheet(null)} style={{ padding: 4 }}>
            <Ionicons name="close" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={styles(colors).attachedProgressRow}>
          <View style={styles(colors).attachedProgressBg}>
            <View style={[styles(colors).attachedProgressFill, { width: `${pct}%`, backgroundColor: color }]} />
          </View>
          <Text style={styles(colors).attachedProgressText}>{pct}%</Text>
        </View>
      </View>
    );
  };

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : null}>
        <View style={s.header}>
          <View style={s.headerIconBox}>
            <Ionicons name="chatbubbles" size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={s.headerTitle}>Community</Text>
            <Text style={s.headerSubtitle}>Share your journey, inspire others</Text>
          </View>
        </View>

        <ScrollView
          style={s.container}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {/* Post Creation */}
          <View style={s.createPostCard}>
            <View style={s.createPostHeader}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
              </View>
              <TextInput
                style={s.createInput}
                placeholder="Share your progress or thoughts..."
                placeholderTextColor={colors.textMuted}
                value={content}
                onChangeText={setContent}
                multiline
                maxLength={5000}
              />
            </View>
            
            {renderSheetAttachment()}

            <View style={s.createPostActions}>
              <TouchableOpacity
                style={s.attachSheetBtn}
                onPress={() => setShowSheetPicker(true)}
              >
                <Ionicons name="share-social-outline" size={16} color={colors.textMuted} />
                <Text style={s.attachSheetText}>{selectedSheet ? 'Change Sheet' : 'Attach Sheet'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.postBtn, (!content.trim() || isPosting) && s.postBtnDisabled]}
                onPress={handlePost}
                disabled={!content.trim() || isPosting}
              >
                {isPosting ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Ionicons name="send" size={14} color="#000" style={{ marginRight: 6 }} />
                    <Text style={s.postBtnText}>Post</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Posts Feed */}
          {isLoading && posts.length === 0 ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : posts.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="sparkles-outline" size={48} color={colors.textMuted} />
              <Text style={s.emptyTitle}>No posts yet</Text>
              <Text style={s.emptySub}>Be the first to share your experience!</Text>
            </View>
          ) : (
            <View style={s.postsList}>
              {posts.map((post) => (
                <View key={post._id} style={s.postCard}>
                  {/* Post Header */}
                  <View style={s.postHeader}>
                    <View style={s.postAuthorRow}>
                      <View style={s.postAvatar}>
                        <Text style={s.postAvatarText}>{post.user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
                      </View>
                      <View>
                        <View style={s.postAuthorNameRow}>
                          <Text style={s.postAuthorName}>{post.user?.name || 'Anonymous'}</Text>
                          {post.user?.role === 'admin' && (
                            <View style={s.adminBadge}>
                              <Ionicons name="shield-checkmark" size={10} color="#F59E0B" />
                              <Text style={s.adminBadgeText}>ADMIN</Text>
                            </View>
                          )}
                        </View>
                        <Text style={s.postTime}>{formatDistanceToNow(new Date(post.createdAt))} ago</Text>
                      </View>
                    </View>
                    {(post.user?._id === user?._id || user?.role === 'admin') && (
                      <TouchableOpacity onPress={() => deletePost(post._id)} style={s.deleteBtn}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Post Content */}
                  <Text style={s.postContent}>{post.content}</Text>

                  {/* Shared Sheet Card */}
                  {post.sharedSheetSnapshot?.name && (
                    <View style={s.sharedSheetCard}>
                      <View style={s.sharedSheetHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="book" size={16} color={post.sharedSheetSnapshot.color || colors.primary} />
                          <Text style={s.sharedSheetName}>{post.sharedSheetSnapshot.name}</Text>
                          <View style={s.sharedSheetTag}>
                            <Text style={s.sharedSheetTagText}>{post.sharedSheetSnapshot.category}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={s.cloneBtn}
                          onPress={() => cloneSheet(post._id)}
                        >
                          <Ionicons name="copy-outline" size={14} color={colors.primary} />
                          <Text style={s.cloneBtnText}>Clone</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={s.sharedSheetProgressRow}>
                        <Text style={s.sharedSheetStats}>{post.sharedSheetSnapshot.solvedProblems} / {post.sharedSheetSnapshot.totalProblems} solved</Text>
                        <Text style={s.sharedSheetStats}>{post.sharedSheetSnapshot.totalProblems ? Math.round((post.sharedSheetSnapshot.solvedProblems / post.sharedSheetSnapshot.totalProblems) * 100) : 0}%</Text>
                      </View>
                      <View style={s.sharedSheetProgressBg}>
                        <View style={[s.sharedSheetProgressFill, { width: `${post.sharedSheetSnapshot.totalProblems ? Math.round((post.sharedSheetSnapshot.solvedProblems / post.sharedSheetSnapshot.totalProblems) * 100) : 0}%`, backgroundColor: post.sharedSheetSnapshot.color || colors.primary }]} />
                      </View>
                    </View>
                  )}

                  {/* Post Actions */}
                  <View style={s.postActionsRow}>
                    <TouchableOpacity style={s.actionItem} onPress={() => likePost(post._id)}>
                      <Ionicons name={isLikedByMe(post) ? 'heart' : 'heart-outline'} size={20} color={isLikedByMe(post) ? '#EC4899' : colors.textMuted} />
                      <Text style={[s.actionItemText, isLikedByMe(post) && { color: '#EC4899' }]}>{post.likesCount || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.actionItem} onPress={() => toggleComments(post._id)}>
                      <Ionicons name="chatbubble-outline" size={18} color={colors.textMuted} />
                      <Text style={s.actionItemText}>{post.commentsCount || 0}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Comments Section */}
                  {expandedComments[post._id] && (
                    <View style={s.commentsSection}>
                      {post.comments?.map((comment, idx) => (
                        <View key={idx} style={s.commentItem}>
                          <View style={s.commentAvatar}>
                            <Text style={s.commentAvatarText}>{comment.user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
                          </View>
                          <View style={s.commentContent}>
                            <View style={s.commentAuthorRow}>
                              <Text style={s.commentAuthor}>{comment.user?.name || 'Anonymous'}</Text>
                              <Text style={s.commentTime}>{formatDistanceToNow(new Date(comment.createdAt))} ago</Text>
                            </View>
                            <Text style={s.commentText}>{comment.content}</Text>
                          </View>
                        </View>
                      ))}
                      
                      <View style={s.commentInputRow}>
                        <TextInput
                          style={s.commentInput}
                          placeholder="Write a comment..."
                          placeholderTextColor={colors.textMuted}
                          value={commentInputs[post._id] || ''}
                          onChangeText={(v) => setCommentInputs((prev) => ({ ...prev, [post._id]: v }))}
                          maxLength={1000}
                        />
                        <TouchableOpacity style={s.commentSendBtn} onPress={() => handleComment(post._id)}>
                          <Ionicons name="send" size={16} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ))}

              {pagination && pagination.page < pagination.pages && (
                <TouchableOpacity style={s.loadMoreBtn} onPress={() => fetchPosts(pagination.page + 1)}>
                  <Text style={s.loadMoreText}>Load more posts</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sheet Picker Modal */}
      <Modal visible={showSheetPicker} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Attach a Sheet</Text>
              <TouchableOpacity onPress={() => setShowSheetPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {sheets.length === 0 ? (
                <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 20 }}>No sheets available to attach.</Text>
              ) : (
                sheets.map(sheet => (
                  <TouchableOpacity
                    key={sheet._id}
                    style={[s.sheetPickerItem, selectedSheet === sheet._id && { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}
                    onPress={() => {
                      setSelectedSheet(selectedSheet === sheet._id ? null : sheet._id);
                      setShowSheetPicker(false);
                    }}
                  >
                    <Ionicons name="book" size={20} color={selectedSheet === sheet._id ? colors.primary : colors.textMuted} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={[s.sheetPickerName, selectedSheet === sheet._id && { color: colors.primary }]}>{sheet.name}</Text>
                      <Text style={s.sheetPickerCat}>{sheet.category.toUpperCase()}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <UserAgreementModal
        visible={showAgreement}
        onAccept={handleAcceptAgreement}
        onDecline={handleDeclineAgreement}
      />
    </SafeAreaView>
  );
};

const styles = (colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  headerIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: `${colors.primary}20`, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  headerSubtitle: { fontSize: 13, color: colors.textMuted },

  createPostCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
  createPostHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${colors.primary}30`, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  createInput: { flex: 1, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, color: colors.text, minHeight: 80, textAlignVertical: 'top' },
  
  attachedSheet: { backgroundColor: colors.background, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: `${colors.primary}30`, marginBottom: 12 },
  attachedHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  attachedTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  attachedProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  attachedProgressBg: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  attachedProgressFill: { height: '100%', borderRadius: 3 },
  attachedProgressText: { fontSize: 11, color: colors.textMuted },

  createPostActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attachSheetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  attachSheetText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  postBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { fontSize: 14, fontWeight: '700', color: '#000' },

  postsList: { gap: 16 },
  postCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  postAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  postAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${colors.primary}20`, justifyContent: 'center', alignItems: 'center' },
  postAvatarText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  postAuthorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postAuthorName: { fontSize: 15, fontWeight: '700', color: colors.text },
  adminBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' },
  adminBadgeText: { fontSize: 9, fontWeight: '800', color: '#F59E0B', marginLeft: 2 },
  postTime: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  deleteBtn: { padding: 8 },

  postContent: { fontSize: 14, color: colors.text, lineHeight: 22, marginBottom: 16 },

  sharedSheetCard: { backgroundColor: colors.background, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  sharedSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sharedSheetName: { fontSize: 15, fontWeight: '700', color: colors.text },
  sharedSheetTag: { backgroundColor: colors.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  sharedSheetTagText: { fontSize: 10, fontWeight: '600', color: colors.textMuted },
  cloneBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${colors.primary}15`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  cloneBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  sharedSheetProgressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  sharedSheetStats: { fontSize: 11, color: colors.textMuted },
  sharedSheetProgressBg: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  sharedSheetProgressFill: { height: '100%', borderRadius: 3 },

  postActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionItemText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },

  commentsSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  commentItem: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  commentAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  commentAvatarText: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  commentContent: { flex: 1 },
  commentAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: colors.text },
  commentTime: { fontSize: 10, color: colors.textMuted },
  commentText: { fontSize: 13, color: colors.textMuted },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  commentInput: { flex: 1, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: colors.text },
  commentSendBtn: { padding: 8, backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border },

  loadMoreBtn: { padding: 14, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  loadMoreText: { fontSize: 14, fontWeight: '600', color: colors.text },

  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 12 },
  emptySub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  sheetPickerItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.background, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  sheetPickerName: { fontSize: 16, fontWeight: '700', color: colors.text },
  sheetPickerCat: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});

export default DiscussionScreen;

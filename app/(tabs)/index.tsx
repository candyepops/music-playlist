import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_URL = 'http://192.168.1.16:3000'; // GANTI dengan IPv4 laptopmu

type Song = { id: string; title: string; artist: string; emoji: string };

const THEMES = {
  emo: {
    bg: '#0d0d0f',
    card: '#1a1a1f',
    text: '#ffffff',
    sub: '#a0a0aa',
    accent: '#ff2e93',
    accentText: '#ffffff',
    border: '#2a2a33',
    icon: '🖤',
    name: 'EMO',
  },
  soft: {
    bg: '#fff0f6',
    card: '#ffffff',
    text: '#5a2a43',
    sub: '#b07a95',
    accent: '#ff8fc0',
    accentText: '#ffffff',
    border: '#ffd6e8',
    icon: '🌸',
    name: 'SOFT',
  },
};

const EMOJIS = ['🎸', '🖤', '🦇', '🥀', '💀', '🎤', '🎧', '🌸'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'emo' | 'soft'>('emo');
  const t = THEMES[mode];

  const [songs, setSongs] = useState<Song[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);

  const loadSongs = async () => {
    try {
      const res = await fetch(`${API_URL}/songs`);
      setSongs(await res.json());
    } catch (e) {
      Alert.alert('Gagal', `Tidak bisa terhubung ke ${API_URL}\n${String(e)}`);
    }
  };

  useEffect(() => {
    loadSongs();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setTitle('');
    setArtist('');
    setEmoji(EMOJIS[0]);
    setModalVisible(true);
  };

  const openEdit = (song: Song) => {
    setEditingId(song.id);
    setTitle(song.title);
    setArtist(song.artist);
    setEmoji(song.emoji);
    setModalVisible(true);
  };

  const save = async () => {
    if (!title.trim() || !artist.trim()) {
      Alert.alert('Oops', 'Judul dan artis harus diisi ya');
      return;
    }
    try {
      const res = await fetch(editingId ? `${API_URL}/songs/${editingId}` : `${API_URL}/songs`, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, artist, emoji }),
      });
      if (!res.ok) throw new Error('Server error');
      setModalVisible(false);
      loadSongs();
    } catch (e) {
      Alert.alert('Gagal', 'Lagu tidak bisa disimpan ke server');
    }
  };

  const remove = (song: Song) => {
    Alert.alert('Hapus lagu', `Hapus "${song.title}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/songs/${song.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Server error');
            loadSongs();
          } catch (e) {
            Alert.alert('Gagal', 'Lagu tidak bisa dihapus');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: t.bg, paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: t.text }]}>My Playlist</Text>
          <Text style={[styles.subtitle, { color: t.accent }]}>
            {songs.length} lagu • {t.name} MODE
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setMode(mode === 'emo' ? 'soft' : 'emo')}
          style={[styles.themeBtn, { backgroundColor: t.card, borderColor: t.border }]}
        >
          <Text style={{ fontSize: 20 }}>{t.icon}</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          <Text style={{ color: t.sub, textAlign: 'center', marginTop: 60 }}>
            Belum ada lagu. Tekan + untuk menambah 🎶
          </Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
            <View style={[styles.cover, { backgroundColor: t.accent }]}>
              <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.songTitle, { color: t.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.songArtist, { color: t.sub }]} numberOfLines={1}>
                {item.artist}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => openEdit(item)}
              style={[styles.smallBtn, { backgroundColor: t.accent }]}
            >
              <Text style={[styles.smallBtnText, { color: t.accentText }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => remove(item)}
              style={[styles.smallBtn, { borderColor: t.accent, borderWidth: 1.5 }]}
            >
              <Text style={[styles.smallBtnText, { color: t.accent }]}>Hapus</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={openAdd}
        style={[styles.fab, { backgroundColor: t.accent, bottom: insets.bottom + 24 }]}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal tambah / edit */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrap}
        >
          <View style={[styles.modal, { backgroundColor: t.card }]}>
            <Text style={[styles.modalTitle, { color: t.text }]}>
              {editingId ? 'Edit Lagu' : 'Tambah Lagu'}
            </Text>

            <TextInput
              placeholder="Judul lagu"
              placeholderTextColor={t.sub}
              value={title}
              onChangeText={setTitle}
              style={[styles.input, { color: t.text, borderColor: t.border }]}
            />
            <TextInput
              placeholder="Artis / band"
              placeholderTextColor={t.sub}
              value={artist}
              onChangeText={setArtist}
              style={[styles.input, { color: t.text, borderColor: t.border }]}
            />

            <Text style={{ color: t.sub, marginBottom: 8 }}>Pilih ikon</Text>
            <View style={styles.emojiRow}>
              {EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  onPress={() => setEmoji(e)}
                  style={[
                    styles.emojiBtn,
                    { borderColor: emoji === e ? t.accent : t.border },
                    emoji === e && { backgroundColor: t.accent + '33' },
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalBtn, { borderColor: t.border, borderWidth: 1.5 }]}
              >
                <Text style={{ color: t.text, fontWeight: '600' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={save}
                style={[styles.modalBtn, { backgroundColor: t.accent }]}
              >
                <Text style={{ color: t.accentText, fontWeight: '700' }}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, marginTop: 6 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  themeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    gap: 10,
  },
  cover: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songTitle: { fontSize: 15, fontWeight: '700' },
  songArtist: { fontSize: 12, marginTop: 2 },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  smallBtnText: { fontSize: 12, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 22,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#fff', fontSize: 32, marginTop: -2 },
  modalWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#000000aa' },
  modal: { padding: 22, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 14 },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 15,
  },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  emojiBtn: { width: 46, height: 46, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  modalBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
});
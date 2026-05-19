export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/') {
      return new Response('Not Found', { status: 404 });
    }
    const siteName = env.SITE_NAME  ?? 'OTC 音乐网';
    const proxy    = env.PROXY_URL  ?? 'https://proxy.api.030101.xyz/';
    const html = buildHTML(siteName, proxy);
    return new Response(html, {
      headers: {
        'Content-Type':  'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  },
};

function buildHTML(siteName, proxy) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    <meta name="theme-color" content="#0f0c29">
    <title>${siteName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet">
    <style>
        * { font-family: 'Inter', system-ui, -apple-system, sans-serif; box-sizing: border-box; }
        body {
            background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
            min-height: 100vh;
            color: white;
        }
        body::before {
            content: '';
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: radial-gradient(circle at 20% 50%, rgba(168,85,247,0.15) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(236,72,153,0.1) 0%, transparent 60%);
            pointer-events: none;
            z-index: 0;
        }
        .glass-modern {
            background: rgba(15,12,41,0.6);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            border-radius: 1.5rem;
        }
        .glass-card {
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255,255,255,0.08);
            transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
            border-radius: 1.5rem;
        }
        .glass-card:hover {
            border-color: rgba(168,85,247,0.3);
            box-shadow: 0 8px 32px rgba(168,85,247,0.1);
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
        }
        .rotate-slow { animation: spin 20s linear infinite; }
        .song-list::-webkit-scrollbar { width: 4px; }
        .song-list::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .song-list::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.5); border-radius: 10px; }
        .song-list::-webkit-scrollbar-thumb:hover { background: rgba(168,85,247,0.8); }
        .loader {
            width: 40px; height: 40px;
            border: 3px solid rgba(168,85,247,0.3);
            border-top-color: #a855f7;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            display: inline-block;
        }
        .quality-btn {
            padding: 0.4rem 0.85rem;
            border-radius: 2rem;
            font-weight: 600;
            transition: all 0.3s;
            font-size: 0.8rem;
            white-space: nowrap;
        }
        .quality-btn-active {
            background: linear-gradient(135deg, #a855f7, #ec489a);
            box-shadow: 0 4px 15px rgba(168,85,247,0.4);
            color: white;
        }
        .song-item {
            transition: all 0.2s ease;
            cursor: pointer;
            border-radius: 0.75rem;
        }
        .song-item:hover {
            background: linear-gradient(90deg, rgba(168,85,247,0.2), rgba(236,72,153,0.1));
            transform: translateX(4px);
        }
        .song-playing {
            background: linear-gradient(90deg, rgba(168,85,247,0.3), rgba(236,72,153,0.15));
            border-left: 3px solid #a855f7;
        }
        .fade-enter-active, .fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
        .fade-enter-from, .fade-leave-to { opacity: 0; transform: translate(-50%, 20px); }
        .tab-btn {
            padding: 0.6rem 1rem;
            border-radius: 1rem;
            transition: all 0.3s;
            font-weight: 600;
            color: rgba(255,255,255,0.6);
            font-size: 0.875rem;
        }
        .tab-btn.active {
            background: rgba(168,85,247,0.2);
            color: white;
            border: 1px solid rgba(168,85,247,0.3);
        }
        @media (min-width: 640px) {
            .tab-btn { padding: 0.75rem 1.5rem; font-size: 1rem; }
        }
        .modal-overlay {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(5px);
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        .control-bar {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
        }
        @media (min-width: 640px) { .control-bar { gap: 1rem; } }
        .control-btn {
            width: 40px; height: 40px;
            border-radius: 50%;
            background: rgba(168,85,247,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            color: white;
            font-size: 18px;
            border: none;
            flex-shrink: 0;
        }
        @media (min-width: 640px) { .control-btn { width: 44px; height: 44px; font-size: 20px; } }
        .control-btn:hover { background: rgba(168,85,247,0.5); transform: scale(1.05); }
        .control-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }
        .control-btn-play {
            background: linear-gradient(135deg, #a855f7, #ec489a);
            width: 52px; height: 52px;
            font-size: 20px;
        }
        @media (min-width: 640px) { .control-btn-play { width: 56px; height: 56px; font-size: 22px; } }
        .control-btn-play:hover { background: linear-gradient(135deg, #9333ea, #db2777); }
        .control-btn-active {
            background: rgba(168,85,247,0.5);
            border: 1px solid rgba(168,85,247,0.6);
        }
        .progress-track {
            flex: 1; height: 6px;
            background: rgba(255,255,255,0.2);
            border-radius: 6px;
            cursor: pointer;
            position: relative;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #a855f7, #ec489a);
            border-radius: 6px;
            position: relative;
        }
        .progress-thumb {
            width: 14px; height: 14px;
            background: white;
            border-radius: 50%;
            position: absolute;
            right: -7px; top: -4px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        audio { display: none; }
        .play-queue-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #a855f7, #ec489a);
            border-radius: 0.5rem;
            padding: 2px 8px;
            font-size: 0.7rem;
            font-weight: 700;
            margin-left: 6px;
        }
        .song-index {
            width: 24px;
            text-align: center;
            font-size: 0.75rem;
            color: rgba(255,255,255,0.3);
            flex-shrink: 0;
        }
        @media (min-width: 640px) { .song-index { width: 28px; } }
        .song-index-playing { color: #a855f7; font-weight: 700; }
        @media (min-width: 1024px) {
            .layout-wrapper {
                display: grid;
                grid-template-columns: 1fr 380px;
                grid-template-rows: auto;
                gap: 1.5rem;
                align-items: start;
            }
            .layout-main   { grid-column: 1; }
            .layout-sidebar {
                grid-column: 2;
                grid-row: 1 / 20;
                position: sticky;
                top: 1.5rem;
            }
        }
        .mini-player {
            position: fixed;
            bottom: 0; left: 0; right: 0;
            z-index: 50;
            background: rgba(15,12,41,0.95);
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(168,85,247,0.3);
            padding: 0.6rem 1rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .mini-player-info { flex: 1; min-width: 0; }
        .mini-player-prog {
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 2px;
            background: rgba(255,255,255,0.15);
        }
        .mini-player-prog-fill {
            height: 100%;
            background: linear-gradient(90deg, #a855f7, #ec489a);
            transition: width 0.5s linear;
        }
        .player-inline { display: none; }
        .player-mini   { display: flex; }
        @media (min-width: 640px) {
            .player-inline { display: block; }
            .player-mini   { display: none; }
        }
        @media (max-width: 639px) {
            .page-bottom-padding { padding-bottom: 80px; }
        }
        @media (max-width: 479px) {
            .song-actions-extra { display: none; }
        }
        @media (min-width: 1024px) {
            .song-list-desktop { max-height: calc(100vh - 280px) !important; }
        }
    </style>
</head>
<body>
<div id="app" class="relative z-10 max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 page-bottom-padding">
    <div class="text-center mb-5 sm:mb-8 layout-main">
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 bg-clip-text text-transparent inline-block">
            ${siteName}
        </h1>
        <p class="text-white/60 text-xs sm:text-sm mt-2">母带级音质 · 随心收藏 · 自由列表</p>
    </div>
    <div class="layout-wrapper">
    <div class="layout-main">
    <div class="flex justify-center gap-2 sm:gap-4 mb-5 sm:mb-8">
        <button @click="switchTab('search')" :class="{active: currentTab==='search'}" class="tab-btn">🔍 <span class="hidden xs:inline">搜索</span><span class="xs:hidden">搜索</span></button>
        <button @click="switchTab('favorites')" :class="{active: currentTab==='favorites'}" class="tab-btn">
            ❤️ 收藏<span v-if="favorites.length" class="play-queue-badge">{{ favorites.length }}</span>
        </button>
        <button @click="switchTab('playlists')" :class="{active: currentTab==='playlists'}" class="tab-btn">
            📁 列表<span v-if="playlists.length" class="play-queue-badge">{{ playlists.length }}</span>
        </button>
    </div>
    <div v-if="currentTab==='search'">
        <div class="glass-modern p-3 sm:p-5 mb-4 sm:mb-6">
            <div class="flex flex-wrap gap-2">
                <button v-for="q in qualities" :key="q.value"
                    @click="currentQuality=q.value; if(currentSong) refreshPlay()"
                    class="quality-btn"
                    :class="currentQuality===q.value ? 'quality-btn-active' : 'bg-white/10 text-white/70'">
                    {{ q.label }}
                </button>
            </div>
        </div>
        <div class="glass-modern p-4 sm:p-6 mb-4 sm:mb-6">
            <div class="flex flex-col sm:flex-row gap-3 mb-4">
                <input v-model="keyword" @keyup.enter="searchMusic" type="text"
                    placeholder="输入歌名、歌手..."
                    class="flex-1 px-4 sm:px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none focus:border-purple-500 text-sm sm:text-base">
                <button @click="searchMusic" :disabled="loading"
                    class="bg-gradient-to-r from-purple-600 to-pink-600 px-6 sm:px-8 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm sm:text-base">
                    <span v-if="loading" class="loader w-4 h-4 border-2"></span>
                    <span>{{ loading ? '搜索中' : '搜索音乐' }}</span>
                </button>
            </div>
            <div class="flex flex-wrap gap-2">
                <span v-for="tag in quickTags" :key="tag" @click="keyword=tag; searchMusic()"
                    class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 text-xs sm:text-sm cursor-pointer hover:bg-purple-500/40">
                    # {{ tag }}
                </span>
            </div>
        </div>
    </div>
    <div v-if="currentTab==='favorites'" class="glass-modern p-4 sm:p-6 mb-4 sm:mb-6">
        <div class="flex flex-wrap justify-between items-center mb-4 gap-3">
            <h2 class="text-lg sm:text-xl font-bold">❤️ 我的收藏 ({{ favorites.length }})</h2>
            <div v-if="favorites.length" class="flex gap-2">
                <button @click="playAll(favorites)" class="bg-purple-600/40 hover:bg-purple-600/70 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all">▶ 全部播放</button>
                <button @click="playShuffle(favorites)" class="bg-pink-600/30 hover:bg-pink-600/50 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all">🔀 随机播放</button>
            </div>
        </div>
        <div v-if="!favorites.length" class="text-white/40 text-center py-10">暂无收藏，快去搜索喜欢的歌吧</div>
    </div>
    <div v-if="currentTab==='playlists'" class="glass-modern p-4 sm:p-6 mb-4 sm:mb-6">
        <div v-if="!currentPlaylist">
            <div class="flex justify-between items-center mb-5">
                <h2 class="text-lg sm:text-xl font-bold">📁 播放列表 ({{ playlists.length }})</h2>
                <button @click="showCreatePlaylist=true" class="bg-purple-600/40 hover:bg-purple-600/60 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-all">+ 新建列表</button>
            </div>
            <div v-if="!playlists.length" class="text-white/40 text-center py-10">暂无播放列表</div>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div v-for="(pl, idx) in playlists" :key="idx" class="glass-card p-3 sm:p-4 flex justify-between items-center">
                    <div @click="openPlaylist(pl)" class="cursor-pointer flex-1 min-w-0">
                        <div class="font-bold truncate">{{ pl.name }}</div>
                        <div class="text-xs text-white/50">{{ pl.songs.length }} 首歌曲</div>
                    </div>
                    <div class="flex items-center gap-1 flex-shrink-0">
                        <button v-if="pl.songs.length" @click.stop="playAll(pl.songs)" class="text-purple-400 hover:text-purple-300 p-2" title="播放全部">▶</button>
                        <button @click.stop="deletePlaylist(idx)" class="text-white/30 hover:text-red-400 p-2">🗑️</button>
                    </div>
                </div>
            </div>
        </div>
        <div v-else>
            <div class="flex flex-wrap justify-between items-center mb-4 gap-3">
                <div class="flex items-center gap-2 sm:gap-3">
                    <button @click="currentPlaylist=null" class="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-lg">←</button>
                    <h2 class="text-lg sm:text-xl font-bold truncate">{{ currentPlaylist.name }}
                        <span class="text-sm text-white/40 font-normal ml-2">{{ currentPlaylist.songs.length }} 首</span>
                    </h2>
                </div>
                <div v-if="currentPlaylist.songs.length" class="flex gap-2">
                    <button @click="playAll(currentPlaylist.songs)" class="bg-purple-600/40 hover:bg-purple-600/70 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all">▶ 全部播放</button>
                    <button @click="playShuffle(currentPlaylist.songs)" class="bg-pink-600/30 hover:bg-pink-600/50 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all">🔀 随机</button>
                </div>
            </div>
            <div v-if="!currentPlaylist.songs.length" class="text-white/40 text-center py-10">列表为空，去搜索并添加歌曲吧</div>
        </div>
    </div>
    <div v-if="displaySongs.length" class="glass-modern p-3 sm:p-4 mb-4 sm:mb-6 max-h-[420px] sm:max-h-[500px] overflow-y-auto song-list song-list-desktop">
        <div v-for="(song, idx) in displaySongs" :key="song.id"
            class="song-item p-2 sm:p-3 flex items-center gap-2 sm:gap-3 mb-1"
            :class="{'song-playing': currentSong?.id===song.id}">
            <div class="song-index" :class="{'song-index-playing': currentSong?.id===song.id}">
                <span v-if="currentSong?.id===song.id">♫</span>
                <span v-else>{{ idx+1 }}</span>
            </div>
            <img :src="song.artwork" class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0" @click="playSong(song)">
            <div class="flex-1 min-w-0" @click="playSong(song)">
                <div class="font-semibold truncate text-sm sm:text-base">{{ song.title }}</div>
                <div class="text-xs text-white/50 truncate">{{ song.artist }}</div>
            </div>
            <div class="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                <button @click="toggleFavorite(song)" class="p-1.5 sm:p-2 hover:scale-110 transition-all text-base">{{ isFavorite(song)?'❤️':'🤍' }}</button>
                <button @click="showAddToPlaylist(song)" class="p-1.5 sm:p-2 hover:scale-110 transition-all song-actions-extra text-base">➕</button>
                <button v-if="currentPlaylist && currentTab==='playlists'" @click="removeFromPlaylist(song)" class="p-1.5 sm:p-2 text-white/30 hover:text-red-400 transition-all text-base">❌</button>
            </div>
        </div>
    </div>
    <div v-if="currentSong" class="glass-card p-4 sm:p-6 mb-4 sm:mb-6 player-inline">
        <div class="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <img :src="currentSong.artwork" class="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl shadow-2xl rotate-slow flex-shrink-0">
            <div class="flex-1 w-full">
                <div class="mb-3 text-center sm:text-left">
                    <h2 class="text-xl sm:text-2xl font-bold truncate">{{ currentSong.title }}</h2>
                    <p class="text-white/60 text-sm sm:text-base">{{ currentSong.artist }}</p>
                    <div class="mt-1 flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                        <span v-if="playQueue.length" class="text-xs text-white/40">队列 {{ currentQueueIndex+1 }} / {{ playQueue.length }}</span>
                        <span v-if="isShuffle" class="text-xs bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full">随机</span>
                        <span v-if="isLoop" class="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">单曲循环</span>
                    </div>
                </div>
                <div class="control-bar">
                    <button @click="toggleShuffle" class="control-btn text-base" :class="{'control-btn-active': isShuffle}" title="随机播放">🔀</button>
                    <button @click="playPrev" class="control-btn" :disabled="!hasPrev">⏮</button>
                    <button @click="togglePlay" class="control-btn control-btn-play">{{ isPlaying?'⏸':'▶' }}</button>
                    <button @click="playNext" class="control-btn" :disabled="!hasNext">⏭</button>
                    <button @click="toggleLoop" class="control-btn text-base" :class="{'control-btn-active': isLoop}" title="单曲循环">🔁</button>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-xs font-mono opacity-50">{{ currentTime }}</span>
                    <div class="progress-track" @click="seek">
                        <div class="progress-fill" :style="{width: progressPercent+'%'}">
                            <div class="progress-thumb"></div>
                        </div>
                    </div>
                    <span class="text-xs font-mono opacity-50">{{ duration }}</span>
                </div>
                <div class="flex gap-2 mt-3 sm:mt-4">
                    <button @click="downloadSong" :disabled="downloading"
                        class="flex-1 bg-green-600/40 hover:bg-green-600/60 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all">
                        <span v-if="downloading" class="loader w-4 h-4 border-2"></span>
                        <span>{{ downloading?'下载中...':'下载歌曲' }}</span>
                    </button>
                    <button @click="toggleFavorite(currentSong)"
                        class="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all"
                        :class="isFavorite(currentSong)?'bg-pink-600/40 hover:bg-pink-600/60':'bg-white/10 hover:bg-white/20'">
                        {{ isFavorite(currentSong)?'❤️ 已收藏':'🤍 收藏' }}
                    </button>
                </div>
            </div>
        </div>
        <audio ref="audioPlayer" :src="currentPlayUrl"
            @loadedmetadata="onLoaded" @timeupdate="onTimeUpdate" @ended="onEnded"></audio>
    </div>
    </div><!-- end layout-main -->
    <div class="layout-sidebar hidden lg:block">
        <div v-if="currentSong" class="glass-card p-5">
            <div class="flex flex-col items-center gap-4">
                <img :src="currentSong.artwork" class="w-48 h-48 rounded-2xl shadow-2xl rotate-slow">
                <div class="w-full text-center">
                    <h2 class="text-xl font-bold truncate">{{ currentSong.title }}</h2>
                    <p class="text-white/60 text-sm mt-1">{{ currentSong.artist }}</p>
                    <div class="mt-2 flex items-center gap-2 justify-center flex-wrap">
                        <span v-if="playQueue.length" class="text-xs text-white/40">{{ currentQueueIndex+1 }} / {{ playQueue.length }}</span>
                        <span v-if="isShuffle" class="text-xs bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full">随机</span>
                        <span v-if="isLoop" class="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">单曲循环</span>
                    </div>
                </div>
                <div class="control-bar w-full">
                    <button @click="toggleShuffle" class="control-btn text-base" :class="{'control-btn-active': isShuffle}">🔀</button>
                    <button @click="playPrev" class="control-btn" :disabled="!hasPrev">⏮</button>
                    <button @click="togglePlay" class="control-btn control-btn-play">{{ isPlaying?'⏸':'▶' }}</button>
                    <button @click="playNext" class="control-btn" :disabled="!hasNext">⏭</button>
                    <button @click="toggleLoop" class="control-btn text-base" :class="{'control-btn-active': isLoop}">🔁</button>
                </div>
                <div class="flex items-center gap-2 w-full">
                    <span class="text-xs font-mono opacity-50 w-10 text-right">{{ currentTime }}</span>
                    <div class="progress-track" @click="seek">
                        <div class="progress-fill" :style="{width: progressPercent+'%'}">
                            <div class="progress-thumb"></div>
                        </div>
                    </div>
                    <span class="text-xs font-mono opacity-50 w-10">{{ duration }}</span>
                </div>
                <div class="flex gap-2 w-full mt-1">
                    <button @click="downloadSong" :disabled="downloading"
                        class="flex-1 bg-green-600/40 hover:bg-green-600/60 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all">
                        <span v-if="downloading" class="loader w-4 h-4 border-2"></span>
                        <span>{{ downloading?'下载中...':'⬇ 下载' }}</span>
                    </button>
                    <button @click="toggleFavorite(currentSong)"
                        class="px-4 py-2 rounded-lg text-sm font-bold transition-all"
                        :class="isFavorite(currentSong)?'bg-pink-600/40 hover:bg-pink-600/60':'bg-white/10 hover:bg-white/20'">
                        {{ isFavorite(currentSong)?'❤️':'🤍' }}
                    </button>
                </div>
            </div>
        </div>
        <div v-else class="glass-card p-8 flex flex-col items-center justify-center gap-3 text-white/30">
            <div class="text-5xl">🎵</div>
            <p class="text-sm">点击歌曲开始播放</p>
        </div>
    </div>
    </div><!-- end layout-wrapper -->
    <div v-if="currentSong" class="mini-player player-mini">
        <div class="mini-player-prog">
            <div class="mini-player-prog-fill" :style="{width: progressPercent+'%'}"></div>
        </div>
        <img :src="currentSong.artwork" class="w-11 h-11 rounded-lg object-cover flex-shrink-0">
        <div class="mini-player-info">
            <div class="font-semibold truncate text-sm">{{ currentSong.title }}</div>
            <div class="text-xs text-white/50 truncate">{{ currentSong.artist }}</div>
        </div>
        <button @click="playPrev" class="control-btn !w-9 !h-9 !text-sm" :disabled="!hasPrev">⏮</button>
        <button @click="togglePlay" class="control-btn control-btn-play !w-11 !h-11 !text-lg">{{ isPlaying?'⏸':'▶' }}</button>
        <button @click="playNext" class="control-btn !w-9 !h-9 !text-sm" :disabled="!hasNext">⏭</button>
    </div>
    <transition name="fade">
        <div v-if="message" class="fixed bottom-24 sm:bottom-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur px-5 py-3 rounded-full text-sm z-[200] border border-white/10 whitespace-nowrap">
            {{ message }}
        </div>
    </transition>
    <div v-if="showCreatePlaylist" class="modal-overlay" @click.self="showCreatePlaylist=false">
        <div class="glass-modern p-5 sm:p-6 w-full max-w-md">
            <h3 class="text-lg sm:text-xl font-bold mb-4">新建播放列表</h3>
            <input v-model="newPlaylistName" @keyup.enter="createPlaylist" type="text" placeholder="输入列表名称..."
                class="w-full bg-white/10 border border-white/20 p-3 rounded-xl mb-4 outline-none focus:border-purple-500 text-white text-base">
            <div class="flex gap-3">
                <button @click="createPlaylist" class="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded-xl font-bold transition-all">创建</button>
                <button @click="showCreatePlaylist=false" class="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-xl transition-all">取消</button>
            </div>
        </div>
    </div>
    <div v-if="songToPlaylist" class="modal-overlay" @click.self="songToPlaylist=null">
        <div class="glass-modern p-5 sm:p-6 w-full max-w-md">
            <h3 class="text-lg sm:text-xl font-bold mb-1">添加到列表</h3>
            <p class="text-white/50 text-sm mb-4 truncate">{{ songToPlaylist.title }}</p>
            <div class="max-h-60 overflow-y-auto mb-4">
                <div v-for="(pl, idx) in playlists" :key="idx" @click="addToPlaylist(pl)"
                    class="p-3 hover:bg-white/10 rounded-lg cursor-pointer flex justify-between items-center transition-all">
                    <span>{{ pl.name }}</span>
                    <span class="text-white/40 text-sm">{{ pl.songs.length }} 首</span>
                </div>
                <div v-if="!playlists.length" class="text-center py-4 text-white/40">暂无列表，请先创建</div>
            </div>
            <button @click="songToPlaylist=null" class="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl transition-all">关闭</button>
        </div>
    </div>
</div>
<script>
const { createApp, ref, computed, watch } = Vue;
const PROXY = '${proxy}';
const defaultCover = 'https://y.gtimg.cn/music/photo_new/T002R300x300M000000MkMni19ClKG.jpg';
createApp({
    setup() {
        const currentTab       = ref('search');
        const keyword          = ref('');
        const songs            = ref([]);
        const loading          = ref(false);
        const currentSong      = ref(null);
        const currentPlayUrl   = ref('');
        const message          = ref('');
        const downloading      = ref(false);
        const currentQuality   = ref('standard');
        const audioPlayer      = ref(null);
        const isPlaying        = ref(false);
        const isLoop           = ref(false);
        const isShuffle        = ref(false);
        const currentTime      = ref('00:00');
        const duration         = ref('00:00');
        const progressPercent  = ref(0);
        const playQueue        = ref([]);
        const currentQueueIndex = ref(-1);
        const favorites        = ref(JSON.parse(localStorage.getItem('otc_favs') || '[]'));
        const playlists        = ref(JSON.parse(localStorage.getItem('otc_pls')  || '[]'));
        const currentPlaylist  = ref(null);
        const showCreatePlaylist = ref(false);
        const newPlaylistName    = ref('');
        const songToPlaylist     = ref(null);
        const qualities  = [
            { value: 'low',      label: '标准'   },
            { value: 'standard', label: '高品质'  },
            { value: 'high',     label: '无损'    },
        ];
        const quickTags = ['晴天','夜曲','起风了','周杰伦','陈奕迅','邓紫棋'];
        watch(favorites, v => localStorage.setItem('otc_favs', JSON.stringify(v)), { deep: true });
        watch(playlists, v => localStorage.setItem('otc_pls',  JSON.stringify(v)), { deep: true });

        const displaySongs = computed(() => {
            if (currentTab.value === 'search')    return songs.value;
            if (currentTab.value === 'favorites') return favorites.value;
            if (currentTab.value === 'playlists') return currentPlaylist.value ? currentPlaylist.value.songs : [];
            return [];
        });
        const hasPrev = computed(() => playQueue.value.length > 0 && currentQueueIndex.value > 0);
        const hasNext = computed(() => playQueue.value.length > 0 && currentQueueIndex.value < playQueue.value.length - 1);
        const showMsg = msg => { message.value = msg; setTimeout(() => message.value = '', 2200); };
        const fmt = s => {
            if (isNaN(s) || s == null) return '00:00';
            return \`\${Math.floor(s/60).toString().padStart(2,'0')}:\${Math.floor(s%60).toString().padStart(2,'0')}\`;
        };
        const searchMusic = async () => {
            if (!keyword.value.trim()) return;
            loading.value = true;
            try {
                const body = {
                    req_1: {
                        method: 'DoSearchForQQMusicDesktop',
                        module: 'music.search.SearchCgiService',
                        param: { num_per_page: 25, page_num: 1, query: keyword.value, search_type: 0 },
                    },
                };
                const res = await axios.post(PROXY + 'https://u.y.qq.com/cgi-bin/musicu.fcg', body);
                const list = res.data?.req_1?.data?.body?.song?.list || [];
                songs.value = list.map(item => ({
                    id:      item.id || item.songid,
                    songmid: item.mid || item.songmid,
                    title:   item.title || item.songname,
                    artist:  item.singer?.map(s => s.name).join(', ') || '未知歌手',
                    artwork: item.album?.mid
                        ? \`https://y.gtimg.cn/music/photo_new/T002R800x800M000\${item.album.mid}.jpg\`
                        : defaultCover,
                    duration: item.interval ? fmt(item.interval) : '03:30',
                }));
                showMsg(\`找到 \${songs.value.length} 首歌曲\`);
            } catch { showMsg('搜索失败'); }
            finally { loading.value = false; }
        };
        const switchTab = tab => {
            currentTab.value = tab;
            if (tab !== 'playlists') currentPlaylist.value = null;
        };
        const playSong = async (song, queue, queueIndex) => {
            if (queue !== undefined) {
                playQueue.value = queue;
                currentQueueIndex.value = queueIndex;
            } else {
                const list = displaySongs.value;
                const idx  = list.findIndex(s => s.id === song.id);
                playQueue.value = [...list];
                currentQueueIndex.value = idx >= 0 ? idx : 0;
            }
            currentSong.value = song;
            showMsg('获取播放链接...');
            try {
                const levelMap = { low: 'standard', standard: 'exhigh', high: 'lossless' };
                const url = \`https://music.haitangw.cc/music/qq_song_kw.php?id=\${song.songmid}&level=\${levelMap[currentQuality.value]}&type=json\`;
                const res = await axios.get(PROXY + url);
                if (res.data?.data?.url) {
                    currentPlayUrl.value = res.data.data.url;
                    isPlaying.value = true;
                    setTimeout(() => audioPlayer.value?.play(), 100);
                } else { showMsg('链接获取失败'); }
            } catch { showMsg('播放失败'); }
        };
        const playAll     = list => { if (!list?.length) return; isShuffle.value = false; const q = [...list]; playSong(q[0], q, 0); showMsg(\`开始播放 \${q.length} 首\`); };
        const playShuffle = list => { if (!list?.length) return; isShuffle.value = true;  const q = [...list].sort(() => Math.random()-0.5); playSong(q[0], q, 0); showMsg(\`随机播放 \${q.length} 首\`); };
        const refreshPlay = () => playSong(currentSong.value);
        const isFavorite = song => favorites.value.some(f => f.id === song.id);
        const toggleFavorite = song => {
            const idx = favorites.value.findIndex(f => f.id === song.id);
            if (idx > -1) { favorites.value.splice(idx, 1); showMsg('已取消收藏'); }
            else          { favorites.value.push(song);     showMsg('已添加到收藏'); }
        };
        const createPlaylist = () => {
            if (!newPlaylistName.value.trim()) return;
            playlists.value.push({ name: newPlaylistName.value.trim(), songs: [] });
            newPlaylistName.value = ''; showCreatePlaylist.value = false; showMsg('列表已创建');
        };
        const deletePlaylist = idx => {
            if (!confirm('确定删除该列表吗？')) return;
            if (currentPlaylist.value === playlists.value[idx]) currentPlaylist.value = null;
            playlists.value.splice(idx, 1);
        };
        const openPlaylist      = pl   => { currentPlaylist.value = pl; };
        const showAddToPlaylist = song => { songToPlaylist.value = song; };
        const addToPlaylist = pl => {
            if (pl.songs.some(s => s.id === songToPlaylist.value.id)) { showMsg('歌曲已在列表中'); }
            else { pl.songs.push(songToPlaylist.value); showMsg(\`已添加到《\${pl.name}》\`); }
            songToPlaylist.value = null;
        };
        const removeFromPlaylist = song => {
            if (!currentPlaylist.value) return;
            const idx = currentPlaylist.value.songs.findIndex(s => s.id === song.id);
            if (idx < 0) return;
            currentPlaylist.value.songs.splice(idx, 1);
            const qi = playQueue.value.findIndex(s => s.id === song.id);
            if (qi > -1) { playQueue.value.splice(qi, 1); if (currentQueueIndex.value >= qi) currentQueueIndex.value = Math.max(0, currentQueueIndex.value-1); }
        };
        const onLoaded     = () => { duration.value = fmt(audioPlayer.value.duration); };
        const onTimeUpdate = () => {
            if (!audioPlayer.value) return;
            currentTime.value     = fmt(audioPlayer.value.currentTime);
            progressPercent.value = (audioPlayer.value.currentTime / audioPlayer.value.duration * 100) || 0;
        };
        const togglePlay = () => {
            if (!audioPlayer.value) return;
            isPlaying.value ? audioPlayer.value.pause() : audioPlayer.value.play();
            isPlaying.value = !isPlaying.value;
        };
        const toggleLoop    = () => { isLoop.value    = !isLoop.value;    showMsg(isLoop.value    ? '单曲循环 开' : '单曲循环 关'); };
        const toggleShuffle = () => { isShuffle.value = !isShuffle.value; showMsg(isShuffle.value ? '随机播放 开' : '随机播放 关'); };
        const seek = e => {
            if (!audioPlayer.value?.duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            audioPlayer.value.currentTime = ((e.clientX - rect.left) / rect.width) * audioPlayer.value.duration;
        };
        const onEnded = () => {
            isPlaying.value = false;
            if (isLoop.value) { audioPlayer.value.currentTime = 0; audioPlayer.value.play(); isPlaying.value = true; return; }
            playNext();
        };
        const pickRandom = () => {
            const idx = Math.floor(Math.random() * playQueue.value.length);
            playSong(playQueue.value[idx], playQueue.value, idx);
        };
        const playPrev = () => {
            if (!playQueue.value.length) return;
            if (isShuffle.value) { pickRandom(); return; }
            if (currentQueueIndex.value > 0) { const ni = currentQueueIndex.value-1; playSong(playQueue.value[ni], playQueue.value, ni); }
        };
        const playNext = () => {
            if (!playQueue.value.length) return;
            if (isShuffle.value) { pickRandom(); return; }
            if (currentQueueIndex.value < playQueue.value.length-1) { const ni = currentQueueIndex.value+1; playSong(playQueue.value[ni], playQueue.value, ni); }
        };
        const downloadSong = async () => {
            if (!currentPlayUrl.value) return;
            downloading.value = true;
            try {
                const res = await axios.get(PROXY + currentPlayUrl.value, { responseType: 'blob' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(res.data);
                a.download = \`\${currentSong.value.title} - \${currentSong.value.artist}.mp3\`;
                a.click();
                showMsg('下载开始');
            } catch { showMsg('下载失败'); }
            finally { downloading.value = false; }
        };
        return {
            currentTab, keyword, songs, loading, currentSong, currentPlayUrl, message, downloading,
            currentQuality, qualities, quickTags, audioPlayer, isPlaying, isLoop, isShuffle,
            currentTime, duration, progressPercent, playQueue, currentQueueIndex,
            favorites, playlists, currentPlaylist, showCreatePlaylist, newPlaylistName, songToPlaylist,
            displaySongs, hasPrev, hasNext,
            switchTab, searchMusic, playSong, playAll, playShuffle, refreshPlay,
            toggleFavorite, isFavorite, createPlaylist, deletePlaylist,
            openPlaylist, showAddToPlaylist, addToPlaylist, removeFromPlaylist,
            onLoaded, onTimeUpdate, togglePlay, toggleLoop, toggleShuffle,
            seek, onEnded, playPrev, playNext, downloadSong,
        };
    }
}).mount('#app');
</script>
</body>
</html>
`;
}

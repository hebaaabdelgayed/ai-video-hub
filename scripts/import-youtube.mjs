import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { loadEnvFile, requireEnv } from './lib/env.mjs';
import { buildSeo, mergeTopics, slugify } from './lib/seo.mjs';

const CHANNEL_ID = 'UCMvdDpKRU_-ZmSz9F1lKOVA';
const API_BASE = 'https://www.googleapis.com/youtube/v3';

loadEnvFile();

const key = requireEnv('YOUTUBE_API_KEY');
const currentData = JSON.parse(readFileSync('data/videos.json', 'utf8'));

async function youtube(endpoint, params = {}) {
  const url = new URL(`${API_BASE}/${endpoint}`);
  for (const [name, value] of Object.entries({ ...params, key })) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(name, value);
  }
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YouTube API ${endpoint} failed (${response.status}): ${text}`);
  }
  return response.json();
}

async function paginate(endpoint, params) {
  const items = [];
  let pageToken;
  do {
    const page = await youtube(endpoint, { ...params, pageToken, maxResults: params.maxResults || 50 });
    items.push(...(page.items || []));
    pageToken = page.nextPageToken;
  } while (pageToken);
  return items;
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function getChannel() {
  const result = await youtube('channels', {
    part: 'snippet,contentDetails,statistics',
    id: CHANNEL_ID
  });
  const channel = result.items?.[0];
  if (!channel) throw new Error(`Channel not found: ${CHANNEL_ID}`);
  return channel;
}

async function getPlaylists() {
  const items = await paginate('playlists', {
    part: 'snippet,contentDetails',
    channelId: CHANNEL_ID,
    maxResults: 50
  });
  return items.map((item) => ({
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description || '',
    slug: slugify(item.snippet.title, item.id),
    thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
    itemCount: item.contentDetails?.itemCount || 0
  }));
}

async function getPlaylistVideoIds(playlistId) {
  const items = await paginate('playlistItems', {
    part: 'snippet,contentDetails',
    playlistId,
    maxResults: 50
  });
  return items
    .map((item) => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId)
    .filter(Boolean);
}

async function getVideoDetails(videoIds) {
  const videos = [];
  for (const ids of chunk(videoIds, 50)) {
    const result = await youtube('videos', {
      part: 'snippet,contentDetails,statistics',
      id: ids.join(',')
    });
    videos.push(...(result.items || []));
  }
  return videos;
}

function normalizeVideo(item, playlistIdsByVideo, playlistNamesByVideo, existingSeoById) {
  const snippet = item.snippet || {};
  const existingSeo = existingSeoById.get(item.id);
  const base = {
    id: item.id,
    title: snippet.title || '',
    description: snippet.description || '',
    publishedAt: snippet.publishedAt || '',
    thumbnail: snippet.thumbnails?.maxres?.url || snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || '',
    channelTitle: snippet.channelTitle || '',
    tags: snippet.tags || [],
    duration: item.contentDetails?.duration || '',
    viewCount: Number(item.statistics?.viewCount || 0),
    likeCount: Number(item.statistics?.likeCount || 0),
    commentCount: Number(item.statistics?.commentCount || 0),
    playlists: playlistIdsByVideo.get(item.id) || [],
    youtubeUrl: `https://www.youtube.com/watch?v=${item.id}`
  };
  return {
    ...base,
    seo: existingSeo || buildSeo(base, playlistNamesByVideo.get(item.id) || [])
  };
}

const channel = await getChannel();
const uploadPlaylistId = channel.contentDetails.relatedPlaylists.uploads;
const playlists = await getPlaylists();
const uploads = await getPlaylistVideoIds(uploadPlaylistId);

const playlistIdsByVideo = new Map();
const playlistNamesByVideo = new Map();
for (const playlist of playlists) {
  const ids = await getPlaylistVideoIds(playlist.id);
  for (const videoId of ids) {
    playlistIdsByVideo.set(videoId, [...(playlistIdsByVideo.get(videoId) || []), playlist.id]);
    playlistNamesByVideo.set(videoId, [...(playlistNamesByVideo.get(videoId) || []), playlist.title]);
  }
}

const details = await getVideoDetails(uploads);
const existingSeoById = new Map((currentData.videos || []).map((video) => [video.id, video.seo]).filter(([, seo]) => seo));
const videos = details
  .map((item) => normalizeVideo(item, playlistIdsByVideo, playlistNamesByVideo, existingSeoById))
  .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

const data = {
  sourceChannelId: CHANNEL_ID,
  lastImportedAt: new Date().toISOString(),
  channel: {
    title: channel.snippet.title,
    description: channel.snippet.description || '',
    url: `https://www.youtube.com/channel/${CHANNEL_ID}`,
    thumbnail: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url || '',
    subscriberCount: Number(channel.statistics?.subscriberCount || 0),
    videoCount: Number(channel.statistics?.videoCount || videos.length),
    viewCount: Number(channel.statistics?.viewCount || 0)
  },
  playlists,
  topics: mergeTopics(videos),
  videos
};

mkdirSync(dirname('data/videos.json'), { recursive: true });
writeFileSync('data/videos.json', `${JSON.stringify(data, null, 2)}\n`);
console.log(`Imported ${videos.length} videos, ${playlists.length} playlists, and ${data.topics.length} topics.`);

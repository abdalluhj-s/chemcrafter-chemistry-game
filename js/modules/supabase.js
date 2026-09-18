// Supabase Cloud Integration Module
// Direct REST API client - zero external bundler dependencies needed!

const SUPABASE_URL = "https://jkcjubfhkvxvioozqgim.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_G0FD67rF8RzbDi6kdWu-8Q_QLRgMseq";
const LEGACY_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprY2p1YmZoa3Z4dmlvb3pxZ2ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MDc4MTYsImV4cCI6MjA5NjE4MzgxNn0.9VLM9AckUow_-SjpQfHi9nzf3koEyzJVAIeim_wLHTI";

class SupabaseService {
  constructor() {
    this.url = SUPABASE_URL;
    // Prefer modern publishable key with legacy fallback
    this.apiKey = SUPABASE_ANON_KEY;
  }

  getHeaders() {
    return {
      "Content-Type": "application/json",
      "apikey": this.apiKey,
      "Authorization": `Bearer ${this.apiKey}`,
      "Prefer": "return=representation"
    };
  }

  async fetchWithFallback(endpoint, options = {}) {
    try {
      options.headers = this.getHeaders();
      let res = await fetch(`${this.url}${endpoint}`, options);
      if (!res.ok && (res.status === 401 || res.status === 403)) {
        // Retry with legacy anon key
        options.headers["apikey"] = LEGACY_KEY;
        options.headers["Authorization"] = `Bearer ${LEGACY_KEY}`;
        res = await fetch(`${this.url}${endpoint}`, options);
      }
      return res;
    } catch (err) {
      console.warn("Supabase network request failed, switching to local cache:", err);
      return null;
    }
  }

  // Fetch top leaderboard scores
  async getLeaderboard() {
    try {
      const res = await this.fetchWithFallback("/rest/v1/chemistry_leaderboard?select=*&order=score.desc&limit=15");
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (e) {
      console.warn("Error fetching leaderboard from Supabase:", e);
    }
    // Fallback default sample data
    return [
      { player_name: "جابر بن حيان", score: 3420, discoveries_count: 24, quests_completed: 12 },
      { player_name: "ماري كوري", score: 3100, discoveries_count: 21, quests_completed: 11 },
      { player_name: "ابن الهيثم الكيميائي", score: 2850, discoveries_count: 18, quests_completed: 10 },
      { player_name: "رازي الكيمياء", score: 2150, discoveries_count: 14, quests_completed: 8 }
    ];
  }

  // Submit player score to Supabase
  async submitScore(playerName, score, discoveriesCount, questsCompleted) {
    if (!playerName || playerName.trim() === "") return false;
    try {
      const res = await this.fetchWithFallback("/rest/v1/chemistry_leaderboard", {
        method: "POST",
        body: JSON.stringify({
          player_name: playerName.trim(),
          score: score || 0,
          discoveries_count: discoveriesCount || 0,
          quests_completed: questsCompleted || 0
        })
      });
      return res && (res.status === 201 || res.status === 200);
    } catch (e) {
      console.warn("Error saving score to Supabase:", e);
      return false;
    }
  }

  // Fetch Community Laboratory Notes
  async getCommunityNotes() {
    try {
      const res = await this.fetchWithFallback("/rest/v1/chemistry_community_notes?select=*&order=created_at.desc&limit=20");
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (e) {
      console.warn("Error fetching community notes from Supabase:", e);
    }
    // Fallback notes
    return [
      {
        id: "1",
        author: "جابر بن حيان",
        title: "سر ملح الطعام",
        formula: "2Na + Cl2 -> 2NaCl",
        content: "الصوديوم فلز نشط ينفجر بالماء، والكلور غاز سام خانق، ولكن اتحادهما ينتج ملح الطعام الضروري لحياتنا!",
        likes: 12
      },
      {
        id: "2",
        author: "ماري كوري",
        title: "الروابط التساهمية في الماء",
        formula: "2H2 + O2 -> 2H2O",
        content: "ينطلق قدر هائل من الطاقة عند احتراق الهيدروجين بالأكسجين ليتكون أثمن سائل في الكون: الماء.",
        likes: 9
      },
      {
        id: "3",
        author: "ابن الهيثم",
        title: "تفاعل معادلة الحمض بالقاعدة",
        formula: "HCl + NaOH -> NaCl + H2O",
        content: "التفاعل بين حمض الهيدروكلوريك الحارق وهيدروكسيد الصوديوم الكاوي يُنتج ماء وملحاً متعادلين تماماً (pH 7).",
        likes: 15
      }
    ];
  }

  // Post a new Community Note
  async postCommunityNote(author, title, formula, content) {
    if (!author || !content) return false;
    try {
      const res = await this.fetchWithFallback("/rest/v1/chemistry_community_notes", {
        method: "POST",
        body: JSON.stringify({
          author: author.trim(),
          title: title ? title.trim() : "ملاحظة كيميائية",
          formula: formula ? formula.trim() : "تفاعل جديد",
          content: content.trim(),
          likes: 1
        })
      });
      return res && (res.status === 201 || res.status === 200);
    } catch (e) {
      console.warn("Error posting note to Supabase:", e);
      return false;
    }
  }

  // Like a note
  async likeNote(id, currentLikes) {
    try {
      const res = await this.fetchWithFallback(`/rest/v1/chemistry_community_notes?id=eq.${id}`, {
        method: "PATCH",
        body: JSON.stringify({ likes: currentLikes + 1 })
      });
      return res && res.ok;
    } catch (e) {
      console.warn("Error liking note:", e);
      return false;
    }
  }
}

export const db = new SupabaseService();

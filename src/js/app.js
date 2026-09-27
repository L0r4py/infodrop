import packageMetadata from '../../package.json';
import { ZONE_PRESENTATION } from '../../lib/local/territory.js';

const DEBUG = false;
const dlog = (...args) => DEBUG && console.log('[DEBUG]', ...args);

let supabaseClient = null;
let ADMIN_EMAILS = [];
let STRIPE_LINK = '';
let REGIONAL_SCHEMA_ENABLED = false;

const LOCAL_CATEGORIES = [
    'Vie locale',
    'Mobilité',
    'Environnement',
    'Montagne',
    'Santé',
    'Services publics',
    'Économie',
    'Culture',
    'Sport'
];
const LOCAL_ONLY_TAGS = new Set(['pyrenees', 'local', ...LOCAL_CATEGORIES]);
const LOCAL_ZONES = [
    'barousse',
    'comminges',
    'luchonnais',
    'nestes_lannemezan',
    'hautes_pyrenees',
    'haute_garonne_sud',
    'val_aran',
    'occitanie'
];

function currentEdition() {
    return /^\/pyr(?:e|é)nees(?:\/|$)/i.test(window.location.pathname) ? 'pyrenees' : 'national';
}

function readStoredObject(key, fallback = {}) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value && typeof value === 'object' ? value : fallback;
    } catch {
        return fallback;
    }
}

async function initializeSupabase() {
    if (supabaseClient) { return true; }
    try {
        const res = await fetch('/api/config');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const cfg = await res.json();
        ADMIN_EMAILS = Array.isArray(cfg.adminEmails) ? cfg.adminEmails : [];
        STRIPE_LINK = cfg.stripeLink || '';
        REGIONAL_SCHEMA_ENABLED = cfg.regionalSchemaEnabled === true;
        const { createClient } = window.supabase;
        supabaseClient = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
        return true;
    } catch (err) {
        console.error('❌ Erreur initialisation:', err);
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `<div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); color: white; display: flex; align-items: center; justify-content: center; z-index: 9999; font-family: Arial;"><div style="text-align: center; padding: 2rem;"><h2>Le flux est momentanément indisponible</h2><p>Réessayez dans quelques instants.</p><button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem;">Recharger</button></div></div>`;
        document.body.appendChild(errorDiv);
        return false;
    }
}

function infodropApp() {
    const ORIENTATION_DATA = { 'extrême-gauche': { class: 'bg-[#FF0000] text-white border-[#CC0000]', color: '#FF0000' }, 'gauche': { class: 'bg-[#D42A2A] text-white border-[#A82020]', color: '#D42A2A' }, 'centre-gauche': { class: 'bg-[#AA5555] text-white border-[#884444]', color: '#AA5555' }, 'centre': { class: 'bg-[#808080] text-white border-[#666666]', color: '#808080' }, 'centre-droit': { class: 'bg-[#5555AA] text-white border-[#444488]', color: '#5555AA' }, 'droite': { class: 'bg-[#2A2AD4] text-white border-[#2020A8]', color: '#2A2AD4' }, 'extrême-droite': { class: 'bg-[#0000FF] text-white border-[#0000CC]', color: '#0000FF' }, 'gouvernement': { class: 'bg-blue-800 text-blue-100 border-blue-900', color: '#1e40af' }, 'neutre': { class: 'bg-green-700 text-green-100 border-green-800', color: '#16a34a' } };
    const edition = currentEdition();

    return {
        edition,
        isLocalEdition: edition === 'pyrenees',
        isDataLoaded: false,
        sessionLoaded: false,
        user: null,
        showLoginModal: false,
        dataError: false,
        deviceId: null,
        email: '',
        showOtp: false,
        otpCode: '',
        loading: false,
        message: '',
        messageType: '',
        newsList: [],
        loadingNews: true,
        latestNewsTimestamp: null,
        updateInterval: null,
        realtimeChannel: null,

        isAdmin: false,
        showAdminPanel: false,
        addingNews: false,
        newNews: { resume: '', url: '' },
        editingNews: {},

        showAboutModal: false,
        showFilters: false,
        showEditPanel: false,
        showMenu: false,

        stats: { total_articles: 0, total_sources: 0 },
        sourceRegistry: [],
        sourceStats: [],
        activeZones: [],
        releaseVersion: packageMetadata.version,

        activeFilter: 'all',
        searchQuery: '',
        allOrientations: [],
        allOtherTags: [],
        activeOrientations: [],
        activeTags: [],
        activeSource: null,

        showReader: false,
        readerLoading: false,
        readerContent: null,
        currentArticle: null,

        readArticles: {},
        readArticlesDetails: {},
        totalReadCount: 0,
        showReadArticles: false,
        hideReadFromMain: true,

        bookmarks: {},
        showBookmarks: false,

        newArticlesCount: 0,
        showNewBadge: false,

        isPulling: false,
        pullDistance: 0,
        pullThreshold: 80,
        isRefreshing: false,
        touchStartY: 0,

        showStatsModal: false,
        showSourcesModal: false,

        newsOffset: 0,
        newsPageSize: 50,
        hasMoreNews: true,
        loadingMore: false,

        async init() {
            if (window.infodropAppInitialized) return;
            window.infodropAppInitialized = true;

            this.updateEditionMetadata();
            this.deviceId = this.getOrCreateDeviceId();
            this.loadLocalPersonalState();

            const isReady = await initializeSupabase();
            if (!isReady) {
                this.sessionLoaded = true;
                this.loadingNews = false;
                this.dataError = true;
                return;
            }

            try {
                const { data } = await supabaseClient.auth.getSession();
                const session = data?.session || null;
                this.user = session?.user || null;
                this.isAdmin = Boolean(this.user && ADMIN_EMAILS.includes(this.user.email));

                if (this.isLocalEdition) await this.loadSourceRegistry();
                if (this.user) {
                    await Promise.all([
                        this.loadReadArticlesFromDB(),
                        this.loadReadPreferences(),
                        this.loadBookmarks()
                    ]);
                }

                await this.loadStats();
                await this.loadNews(this.activeFilter, true);
                this.computeNewArticlesCount();
                this.startAutoUpdate();
                this.setupPullToRefresh();
                if (session) this.setupRealtime(session);
                this.isDataLoaded = true;
            } catch (error) {
                console.error('[Infodrop] Chargement du flux impossible:', error);
                this.loadingNews = false;
                this.dataError = true;
            } finally {
                this.sessionLoaded = true;
            }

            supabaseClient.auth.onAuthStateChange((event) => {
                if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') window.location.reload();
            });
        },

        storageKey(kind) {
            return `infodrop_${kind}_${this.edition}_v1`;
        },

        getOrCreateDeviceId() {
            const key = 'infodrop_device_id_v1';
            let value = localStorage.getItem(key);
            if (!value) {
                value = globalThis.crypto?.randomUUID?.() || `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
                localStorage.setItem(key, value);
            }
            return value;
        },

        loadLocalPersonalState() {
            this.readArticles = readStoredObject(this.storageKey('read_articles'));
            this.readArticlesDetails = readStoredObject(this.storageKey('read_details'));
            this.bookmarks = readStoredObject(this.storageKey('bookmarks'));
            const savedPreference = localStorage.getItem(this.storageKey('hide_read'));
            if (savedPreference !== null) this.hideReadFromMain = savedPreference === 'true';
            this.updateTotalReadCount();
        },

        persistLocalPersonalState() {
            const recentReadIds = Object.entries(this.readArticles)
                .sort((a, b) => new Date(b[1]) - new Date(a[1]))
                .slice(0, 500);
            const readArticles = Object.fromEntries(recentReadIds);
            const readDetails = Object.fromEntries(recentReadIds
                .filter(([id]) => this.readArticlesDetails[id])
                .map(([id]) => [id, this.readArticlesDetails[id]]));
            const bookmarks = Object.fromEntries(Object.entries(this.bookmarks)
                .sort((a, b) => new Date(b[1].bookmarked_at || 0) - new Date(a[1].bookmarked_at || 0))
                .slice(0, 500));

            localStorage.setItem(this.storageKey('read_articles'), JSON.stringify(readArticles));
            localStorage.setItem(this.storageKey('read_details'), JSON.stringify(readDetails));
            localStorage.setItem(this.storageKey('bookmarks'), JSON.stringify(bookmarks));
            localStorage.setItem(this.storageKey('hide_read'), String(this.hideReadFromMain));
        },

        async loadSourceRegistry() {
            const response = await fetch('/config/sources-pyrenees.json', { cache: 'no-store' });
            if (!response.ok) throw new Error('Registre des sources indisponible');
            const registry = await response.json();
            this.sourceRegistry = (registry.sources || []).filter(source => source.active);
        },

        async markAsRead(id) {
            if (this.readArticles[id]) return;

            this.readArticles[id] = new Date().toISOString();
            const article = this.newsList.find(n => n.id === id) || this.bookmarks[id];
            if (article && !this.readArticlesDetails[id]) {
                this.readArticlesDetails[id] = JSON.parse(JSON.stringify(article));
            }
            this.updateTotalReadCount();
            this.persistLocalPersonalState();
            if (this.user) await this.saveReadArticleToDB(id);
        },

        async openReader(news) {
            // Reader function disabled temporarily
            /*
            this.showReader = true;
            this.readerLoading = true;
            this.readerContent = null;
            this.currentArticle = news;
            document.body.style.overflow = 'hidden';
            */

            this.markAsRead(news.id);
            window.open(news.url, '_blank', 'noopener,noreferrer');

            /*
            try {
                const res = await fetch(`/api/extract?url=${encodeURIComponent(news.url)}`);
                if (!res.ok) {
                    throw new Error('Erreur lors de la récupération du contenu');
                }
                const data = await res.json();
                this.readerContent = data;
            } catch (error) {
                console.error('Reader error:', error);
                this.readerContent = { error: true, message: 'Impossible de charger l\'article. Vous pouvez toujours l\'ouvrir dans un nouvel onglet.' };
            } finally {
                this.readerLoading = false;
            }
            */
        },

        closeReader() {
            this.showReader = false;
            setTimeout(() => {
                this.readerContent = null;
                this.currentArticle = null;
            }, 300);
            document.body.style.overflow = '';
        },

        toggleFilter(filter) {
            this.activeFilter = (this.activeFilter === filter) ? 'all' : filter;
            this.activeSource = null;
            this.searchQuery = '';
            this.loadNews(this.activeFilter, true);
        },

        setSourceFilter(source) {
            if (this.activeSource === source) {
                this.activeSource = null;
            } else {
                this.activeSource = source;
                this.activeFilter = 'all';
            }
            this.searchQuery = '';
            this.loadNews(this.activeFilter, true);
        },

        getOrientationDisplayName(orientation) {
            if (!orientation) return '';
            if (orientation === 'gouvernement') return '🇫🇷 Gouvernement';
            if (orientation === '🧨infodrop.live') return orientation;
            if (orientation === 'extrême-gauche') return 'Ext. gauche';
            if (orientation === 'extrême-droite') return 'Ext. droite';
            return orientation.replace('-', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        },

        isPaywalled(news) {
            if (news.tags && news.tags.includes('Abonné')) return true;
            const paywallSources = ['Arrêt sur Images', 'Mediapart', 'Les Jours'];
            if (paywallSources.includes(news.source)) return true;
            if (news.resume) {
                const text = news.resume.toLowerCase();
                const keywords = ['réservé aux abonnés', 'abonnez-vous', 'pour lire la suite', 'contenu réservé'];
                if (keywords.some(k => text.includes(k))) return true;
            }
            return false;
        },

        get filteredNewsList() {
            if (!this.searchQuery || this.searchQuery.trim() === '') return this.newsList;
            const query = this.searchQuery.toLowerCase().trim();
            return this.newsList.filter(news => (
                (news.resume && news.resume.toLowerCase().includes(query))
                || (news.source && news.source.toLowerCase().includes(query))
                || (news.locality && news.locality.toLowerCase().includes(query))
                || (news.category && news.category.toLowerCase().includes(query))
                || (news.tags && news.tags.some(tag => tag.toLowerCase().includes(query)))
                || (news.orientation && news.orientation.toLowerCase().includes(query))
            ));
        },

        visibleTags(news) {
            const hidden = new Set(['🧨infodrop.live', 'pyrenees', 'local', 'abonné']);
            return [...new Set(news.tags || [])]
                .filter(tag => !hidden.has(String(tag).toLowerCase()))
                .slice(0, 4);
        },

        getOrientationColor(o) { return ORIENTATION_DATA[o]?.color || '#808080'; },
        getOrientationClass(o) { return ORIENTATION_DATA[o]?.class || 'bg-gray-700 text-gray-200 border-gray-600'; },

        async login() {
            if (this.loading) return;
            this.loading = true;
            this.message = '';
            this.messageType = '';

            try {
                if (this.showOtp) {
                    const { error: verifyError, data } = await supabaseClient.auth.verifyOtp({
                        email: this.email.toLowerCase(),
                        token: this.otpCode,
                        type: 'email'
                    });

                    if (verifyError) {
                        // Fallback type magiclink in case the template is configured as such
                        const { error: magicError } = await supabaseClient.auth.verifyOtp({
                            email: this.email.toLowerCase(),
                            token: this.otpCode,
                            type: 'magiclink'
                        });
                        if (magicError) throw magicError;
                    }

                    this.message = '🚀 Connexion réussie...';
                    this.messageType = 'success';
                    setTimeout(() => window.location.reload(), 500);
                } else {
                    const { error: otpError } = await supabaseClient.auth.signInWithOtp({
                        email: this.email.toLowerCase(),
                        options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` }
                    });
                    if (otpError) throw otpError;
                    this.showOtp = true;
                    this.message = 'Entrez le code à 6 chiffres reçu par e-mail.';
                    this.messageType = 'success';
                }
            } catch (error) {
                console.error('[Infodrop] Connexion impossible:', error);
                this.message = this.showOtp
                    ? 'Le code est invalide ou expiré.'
                    : 'Impossible d’envoyer le code pour le moment. Réessayez dans quelques instants.';
                this.messageType = 'error';
            } finally {
                this.loading = false;
            }
        },

        setupRealtime(session) {
            this.realtimeChannel = supabaseClient.channel('infodrop-online-users', { config: { presence: { key: session.user.id } } });
            this.realtimeChannel.on('presence', { event: 'sync' }, () => {
                this.connectedUsers = Object.keys(this.realtimeChannel.presenceState()).length;
            }).subscribe(async (status) => {
                if (status === 'SUBSCRIBED') { await this.realtimeChannel.track({ online_at: new Date().toISOString() }); }
            });
        },

        openEditPanel(news) {
            this.editingNews = { ...JSON.parse(JSON.stringify(news)), tagsText: (news.tags || []).join(', ') };
            this.showEditPanel = true;
        },

        async updateNews() {
            const { id, resume, source, url, orientation, tagsText } = this.editingNews;
            const tags = tagsText ? tagsText.split(',').map(t => t.trim()).filter(Boolean) : [];
            try {
                await supabaseClient.from('actu').update({ resume, source, url, orientation, tags }).eq('id', id);
                const index = this.newsList.findIndex(n => n.id === id);
                if (index !== -1) { this.newsList[index] = { ...this.newsList[index], resume, source, url, orientation, tags }; }
                this.showEditPanel = false;
                this.updateTagsList();
            } catch (e) { alert("La mise à jour a échoué."); }
        },

        async deleteNews(id) {
            if (!confirm("Supprimer ?")) return;
            this.newsList = this.newsList.filter(n => n.id !== id);
            try {
                await supabaseClient.from('actu').delete().eq('id', id);
                if (this.isAdmin) this.loadStats();
            } catch (e) { alert("La suppression a échoué."); this.loadNews(); }
        },

        async addManualNews() {
            this.addingNews = true;
            try {
                if (!this.newNews.resume || !this.newNews.resume.trim()) { throw new Error('Le résumé est obligatoire'); }
                if (!this.newNews.url || !this.newNews.url.trim()) { throw new Error('L\'URL est obligatoire'); }
                let tags = ['🧨infodrop.live'];
                if (this.newNews.tagsText && this.newNews.tagsText.trim()) {
                    const additionalTags = this.newNews.tagsText.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0 && tag !== '🧨infodrop.live');
                    tags = tags.concat(additionalTags);
                }
                const articleData = { resume: this.newNews.resume.trim(), source: '🧨infodrop.live', url: this.newNews.url.trim(), heure: new Date().toISOString(), tags: tags, added_by: this.user.email };
                if (this.newNews.orientation && this.newNews.orientation.trim()) { articleData.orientation = this.newNews.orientation.trim(); }
                const { error } = await supabaseClient.from('actu').insert(articleData).select('*');
                if (error) { throw new Error(`Erreur DB: ${error.message}`); }
                this.newNews = { resume: '', source: '', url: '', orientation: '', tagsText: '' };
                this.showAdminPanel = false;
                await this.loadNews();
                if (this.isAdmin) this.loadStats();
                alert('✅ Article ajouté avec succès !');
            } catch (error) {
                alert('Erreur lors de l\'ajout de l\'article: ' + error.message);
            } finally {
                this.addingNews = false;
            }
        },

        distributeArticles(articles) {
            if (!articles || articles.length <= 1) return articles;
            const result = [...articles];

            for (let i = 0; i < result.length - 1; i++) {
                if (result[i].source === result[i + 1].source) {
                    let swapIdx = -1;
                    for (let j = i + 2; j < result.length; j++) {
                        if (result[j].source !== result[i].source) {
                            swapIdx = j;
                            break;
                        }
                    }
                    if (swapIdx !== -1) {
                        const temp = result[i + 1];
                        result[i + 1] = result[swapIdx];
                        result[swapIdx] = temp;
                    }
                }
            }
            return result;
        },

        async loadData(isInitial = false) {
            if (isInitial) this.loadingNews = true;
            await this.loadStats();
            if (isInitial) {
                await this.loadNews(this.activeFilter, true);
            }
            if (isInitial) this.loadingNews = false;
        },

        async fetchNews({ filter = 'all', offset = 0, limit = this.newsPageSize, newerThan = null } = {}) {
            const enhancedFields = 'id, resume, url, heure, source, orientation, tags, added_by, edition_slug, territory_zone, locality, category, is_paywalled, source_kind, source_slug, canonical_url';
            const legacyFields = 'id, resume, url, heure, source, orientation, tags, added_by';
            const runQuery = async (enhanced) => {
                let query = supabaseClient
                    .from('actu')
                    .select(enhanced ? enhancedFields : legacyFields)
                    .order('heure', { ascending: false });

                if (this.isLocalEdition) {
                    query = enhanced
                        ? query.eq('edition_slug', 'pyrenees')
                        : query.contains('tags', ['pyrenees']);
                    query = query.gte('heure', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
                } else if (enhanced) {
                    query = query.or('edition_slug.is.null,edition_slug.neq.pyrenees');
                }

                if (filter && filter !== 'all') {
                    if (this.isLocalEdition) {
                        if (enhanced && LOCAL_ZONES.includes(filter)) query = query.eq('territory_zone', filter);
                        else if (enhanced && LOCAL_CATEGORIES.includes(filter)) query = query.eq('category', filter);
                        else query = query.contains('tags', [filter]);
                    } else if (this.allOrientations.includes(filter)) {
                        query = query.eq('orientation', filter);
                    } else {
                        query = query.contains('tags', [filter]);
                    }
                }
                if (this.activeSource) query = query.eq('source', this.activeSource);
                if (newerThan) query = query.gt('heure', newerThan).limit(limit);
                else query = query.range(offset, offset + limit - 1);
                return query;
            };

            return runQuery(REGIONAL_SCHEMA_ENABLED);
        },

        async loadNews(filter = null, isNewFilter = false) {
            if (isNewFilter) {
                this.loadingNews = true;
                this.newsOffset = 0;
                this.hasMoreNews = true;
            }
            try {
                const { data: newArticles, error } = await this.fetchNews({
                    filter: filter || 'all',
                    offset: 0,
                    limit: this.newsPageSize,
                    newerThan: !isNewFilter ? this.latestNewsTimestamp : null
                });
                if (error) throw error;

                if (newArticles && newArticles.length > 0) {
                    if (isNewFilter) {
                        this.newsList = this.distributeArticles(newArticles);
                        this.newsOffset = newArticles.length;
                    } else {
                        this.newsList = this.distributeArticles([...newArticles, ...this.newsList]);
                    }
                    this.latestNewsTimestamp = this.newsList[0].heure;
                    if (isNewFilter && newArticles.length < this.newsPageSize) this.hasMoreNews = false;
                } else if (isNewFilter) {
                    this.newsList = [];
                    this.hasMoreNews = false;
                }
                this.dataError = false;
                if (this.isLocalEdition) this.updateLocalStats();
            } catch (e) {
                console.error('Erreur dans loadNews:', e);
                this.dataError = true;
            } finally {
                if (isNewFilter) this.loadingNews = false;
            }
        },

        async loadMoreNews() {
            if (this.loadingMore || !this.hasMoreNews) return;
            this.loadingMore = true;
            try {
                const { data, error } = await this.fetchNews({
                    filter: this.activeFilter,
                    offset: this.newsOffset,
                    limit: this.newsPageSize
                });
                if (error) throw error;
                if (data && data.length > 0) {
                    this.newsList = this.distributeArticles([...this.newsList, ...data]);
                    this.newsOffset += data.length;
                    if (data.length < this.newsPageSize) this.hasMoreNews = false;
                } else {
                    this.hasMoreNews = false;
                }
                if (this.isLocalEdition) this.updateLocalStats();
            } catch (e) {
                console.error('Erreur loadMoreNews:', e);
            } finally {
                this.loadingMore = false;
            }
        },

        updateTagsList() {
            if (this.isLocalEdition) {
                this.allOrientations = [];
                const activeZoneSet = new Set(this.activeZones);
                const activeCategorySet = new Set(this.activeTags);
                this.allOtherTags = [
                    ...LOCAL_ZONES.filter(zone => activeZoneSet.has(zone)),
                    ...LOCAL_CATEGORIES.filter(category => activeCategorySet.has(category))
                ];
                return;
            }
            const pol = ['extrême-gauche', 'gauche', 'centre-gauche', 'centre', 'centre-droit', 'droite', 'extrême-droite', 'gouvernement', 'neutre'];
            this.allOrientations = pol;
            this.allOtherTags = this.activeTags.filter(tag => !pol.includes(tag) && !LOCAL_ONLY_TAGS.has(tag));
        },

        hasArticlesForOrientation(o) { return this.activeOrientations.includes(o); },
        hasArticlesForTag(t) {
            return this.activeTags.includes(t) || (this.isLocalEdition && this.activeZones.includes(t));
        },

        getEmptyFilterMessage() {
            if (this.isLocalEdition) return `Aucune actualité locale pour « ${this.getFilterLabel(this.activeFilter)} » ces dernières 24 heures.`;
            if (this.allOrientations.includes(this.activeFilter)) return `Aucun média d'orientation "${this.activeFilter.replace('-', ' ')}" n'a publié ces dernières 24h.`;
            return `Aucun article avec le tag "${this.activeFilter}" ces dernières 24h.`;
        },

        async loadStats() {
            try {
                let { data, error } = REGIONAL_SCHEMA_ENABLED
                    ? await supabaseClient.rpc('get_edition_stats', { p_edition_slug: this.edition })
                    : await supabaseClient.rpc('get_live_stats');
                // Repli temporaire pendant une propagation de schéma ou un retour arrière.
                if (error && REGIONAL_SCHEMA_ENABLED && !this.isLocalEdition) {
                    ({ data, error } = await supabaseClient.rpc('get_live_stats'));
                }
                if (error) throw error;
                this.stats = { total_articles: data.total_articles || 0, total_sources: data.total_sources || 0 };
                this.activeOrientations = data.active_orientations || [];
                this.activeTags = data.active_tags || [];
                this.activeZones = data.active_zones || [];

                if (REGIONAL_SCHEMA_ENABLED) {
                    const sourceResult = await supabaseClient.rpc('get_edition_source_stats', { p_edition_slug: this.edition });
                    if (sourceResult.error) throw sourceResult.error;
                    this.sourceStats = Array.isArray(sourceResult.data) ? sourceResult.data : [];
                }
                this.updateTagsList();
            } catch (e) {
                console.error('[ERREUR] Le chargement des statistiques et filtres a échoué :', e);
            }
        },

        updateLocalStats() {
            if (!this.activeTags.length) {
                const activeCategories = new Set(this.newsList.map(article => article.category).filter(Boolean));
                this.activeTags = LOCAL_CATEGORIES.filter(category => activeCategories.has(category));
            }
            if (!this.activeZones.length) {
                this.activeZones = [...new Set(this.newsList.map(article => article.territory_zone).filter(Boolean))];
            }
            this.updateTagsList();
        },

        async saveReadArticleToDB(articleId) {
            if (!this.user) return;
            if (this.isLocalEdition && !REGIONAL_SCHEMA_ENABLED) return;
            try {
                const payload = {
                    user_id: this.user.id,
                    article_id: articleId,
                    read_at: this.readArticles[articleId] || new Date().toISOString(),
                    edition_slug: this.edition
                };
                const effectivePayload = REGIONAL_SCHEMA_ENABLED
                    ? payload
                    : (({ edition_slug: _edition, ...legacyPayload }) => legacyPayload)(payload);
                const result = await supabaseClient.from('user_read_articles')
                    .upsert(effectivePayload, { onConflict: 'user_id,article_id' });
                if (result.error) throw result.error;
            } catch (error) { console.error('Erreur sauvegarde article lu:', error); }
        },

        async loadReadArticlesFromDB() {
            if (!this.user) return;
            if (this.isLocalEdition && !REGIONAL_SCHEMA_ENABLED) return;
            try {
                let result = supabaseClient.from('user_read_articles')
                    .select(REGIONAL_SCHEMA_ENABLED ? 'article_id, read_at, edition_slug' : 'article_id, read_at')
                    .eq('user_id', this.user.id);
                if (REGIONAL_SCHEMA_ENABLED) result = result.eq('edition_slug', this.edition);
                result = await result;
                if (result.error) throw result.error;
                const data = result.data || [];
                const remoteIds = new Set();
                if (data && data.length > 0) {
                    const idsToFetch = [];
                    data.forEach(item => {
                        remoteIds.add(item.article_id);
                        const localDate = this.readArticles[item.article_id];
                        this.readArticles[item.article_id] = !localDate || new Date(item.read_at) > new Date(localDate)
                            ? item.read_at
                            : localDate;
                        idsToFetch.push(item.article_id);
                    });

                    for (let i = 0; i < idsToFetch.length; i += 500) {
                        const chunk = idsToFetch.slice(i, i + 500);
                        const articleFields = REGIONAL_SCHEMA_ENABLED
                            ? 'id, resume, url, heure, source, orientation, tags, added_by, edition_slug, territory_zone, locality, category, is_paywalled'
                            : 'id, resume, url, heure, source, orientation, tags, added_by';
                        const articleResult = await supabaseClient.from('actu')
                            .select(articleFields)
                            .in('id', chunk);

                        if (articleResult.data) {
                            articleResult.data.forEach(actu => {
                                this.readArticlesDetails[actu.id] = actu;
                            });
                        }
                    }
                }

                const localOnlyIds = Object.keys(this.readArticles).filter(id => !remoteIds.has(id));
                for (const id of localOnlyIds) await this.saveReadArticleToDB(id);
                this.persistLocalPersonalState();
                this.updateTotalReadCount();
            } catch (error) { console.error('Erreur chargement articles lus:', error); }
        },

        getReadArticlesList() {
            return Object.values(this.readArticlesDetails)
                .filter(news => this.readArticles[news.id])
                .sort((a, b) => new Date(this.readArticles[b.id]) - new Date(this.readArticles[a.id]));
        },

        async saveReadPreferences() {
            localStorage.setItem(this.storageKey('hide_read'), String(this.hideReadFromMain));
            if (!this.user) return;
            try {
                await supabaseClient.from('user_preferences').upsert({ user_id: this.user.id, hide_read_articles: this.hideReadFromMain, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
            } catch (error) { console.error('Erreur sauvegarde préférences:', error); }
        },

        async loadReadPreferences() {
            if (!this.user) return;
            try {
                const { data, error } = await supabaseClient.from('user_preferences').select('hide_read_articles').eq('user_id', this.user.id).maybeSingle();
                if (error) throw error;
                if (data) {
                    this.hideReadFromMain = data.hide_read_articles;
                    localStorage.setItem(this.storageKey('hide_read'), String(this.hideReadFromMain));
                }
            } catch (error) {
                console.error('[ERREUR] Chargement des préférences utilisateur échoué :', error);
            }
        },

        updateTotalReadCount() {
            this.totalReadCount = Object.keys(this.readArticles).length;
        },

        async loadBookmarks() {
            if (!this.user) return;
            if (this.isLocalEdition && !REGIONAL_SCHEMA_ENABLED) return;
            try {
                let result = supabaseClient.from('user_bookmarks').select('*').eq('user_id', this.user.id);
                if (REGIONAL_SCHEMA_ENABLED) result = result.eq('edition_slug', this.edition);
                result = await result;
                if (result.error) throw result.error;

                const remoteIds = new Set();
                if (result.data) {
                    result.data.forEach(bm => {
                        if (this.isLocalEdition && bm.edition_slug === undefined && !(bm.tags || []).includes('pyrenees')) return;
                        if (!this.isLocalEdition && bm.edition_slug === undefined && (bm.tags || []).includes('pyrenees')) return;
                        remoteIds.add(bm.article_id);
                        this.bookmarks[bm.article_id] = {
                            id: bm.article_id,
                            resume: bm.resume,
                            url: bm.url,
                            source: bm.source,
                            heure: bm.heure,
                            orientation: bm.orientation,
                            tags: bm.tags,
                            added_by: bm.added_by,
                            bookmarked_at: bm.created_at
                        };
                    });
                }
                const localOnly = Object.values(this.bookmarks).filter(bookmark => !remoteIds.has(bookmark.id));
                for (const bookmark of localOnly) await this.saveBookmarkToDB(bookmark);
                this.persistLocalPersonalState();
            } catch (e) {
                console.error('[ERREUR] Impossible de charger les favoris:', e);
            }
        },

        async saveBookmarkToDB(news) {
            if (!this.user) return;
            if (this.isLocalEdition && !REGIONAL_SCHEMA_ENABLED) return;
            const payload = {
                user_id: this.user.id,
                article_id: news.id,
                resume: news.resume,
                url: news.url,
                source: news.source,
                heure: news.heure,
                orientation: news.orientation,
                tags: news.tags,
                added_by: news.added_by,
                edition_slug: this.edition
            };
            const effectivePayload = REGIONAL_SCHEMA_ENABLED
                ? payload
                : (({ edition_slug: _edition, ...legacyPayload }) => legacyPayload)(payload);
            const result = await supabaseClient.from('user_bookmarks').upsert(effectivePayload, { onConflict: 'user_id,article_id' });
            if (result.error) throw result.error;
        },

        async toggleBookmark(news) {
            if (this.bookmarks[news.id]) {
                delete this.bookmarks[news.id];
                this.persistLocalPersonalState();
                if (this.user) try {
                    await supabaseClient.from('user_bookmarks').delete().match({ user_id: this.user.id, article_id: news.id });
                } catch (e) { console.error('Erreur supression favori:', e); }
            } else {
                const newBookmark = {
                    id: news.id,
                    resume: news.resume,
                    url: news.url,
                    source: news.source,
                    heure: news.heure,
                    orientation: news.orientation,
                    tags: news.tags,
                    added_by: news.added_by,
                    territory_zone: news.territory_zone,
                    locality: news.locality,
                    category: news.category,
                    bookmarked_at: new Date().toISOString()
                };
                this.bookmarks[news.id] = newBookmark;
                this.persistLocalPersonalState();

                if (this.user) try {
                    await this.saveBookmarkToDB(newBookmark);
                } catch (e) { console.error('Erreur ajout favori:', e); }
            }
        },

        isBookmarked(id) {
            return !!this.bookmarks[id];
        },

        async shareArticle(news) {
            const shareData = {
                title: 'infodrop.live - ' + news.source,
                text: news.resume,
                url: news.url
            };

            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('Erreur de partage:', err);
                    }
                }
            } else {
                try {
                    await navigator.clipboard.writeText(shareData.url);
                    alert("Lien copié dans le presse-papiers !");
                } catch (err) {
                    console.error('Erreur copie presse-papiers:', err);
                }
            }
        },

        getBookmarksList() {
            return Object.values(this.bookmarks).sort((a, b) => new Date(b.bookmarked_at) - new Date(a.bookmarked_at));
        },

        get bookmarksCount() {
            return Object.keys(this.bookmarks).length;
        },

        computeNewArticlesCount() {
            const key = `infodrop_last_visit_${this.edition}_${this.user?.id || this.deviceId}`;
            const lastVisit = localStorage.getItem(key);
            if (lastVisit && this.newsList.length > 0) {
                this.newArticlesCount = this.newsList.filter(n => new Date(n.heure) > new Date(lastVisit)).length;
                if (this.newArticlesCount > 0) {
                    this.showNewBadge = true;
                    setTimeout(() => { this.showNewBadge = false; }, 8000);
                }
            }
            localStorage.setItem(key, new Date().toISOString());
        },

        dismissNewBadge() {
            this.showNewBadge = false;
        },

        setupPullToRefresh() {
            const main = document.querySelector('main');
            if (!main) return;
            let startY = 0;
            let startX = 0;
            let pulling = false;
            let isHorizontalScroll = false;

            main.addEventListener('touchstart', (e) => {
                if (window.scrollY === 0) {
                    startY = e.touches[0].clientY;
                    startX = e.touches[0].clientX;
                    pulling = true;
                    isHorizontalScroll = false;
                }
            }, { passive: true });

            main.addEventListener('touchmove', (e) => {
                if (!pulling || this.isRefreshing) return;

                const currentY = e.touches[0].clientY;
                const currentX = e.touches[0].clientX;
                const diffY = currentY - startY;
                const diffX = Math.abs(currentX - startX);

                if (diffX > diffY && diffX > 10) {
                    isHorizontalScroll = true;
                }

                if (isHorizontalScroll) return;

                if (diffY > 0 && window.scrollY === 0) {
                    this.pullDistance = Math.min(diffY * 0.5, 120);
                    this.isPulling = true;
                }
            }, { passive: true });

            main.addEventListener('touchend', async () => {
                if (!this.isPulling) {
                    pulling = false;
                    isHorizontalScroll = false;
                    return;
                }
                if (this.pullDistance >= this.pullThreshold) {
                    this.isRefreshing = true;
                    this.pullDistance = 60;
                    await this.loadNews(this.activeFilter, true);
                    this.isRefreshing = false;
                }
                this.pullDistance = 0;
                this.isPulling = false;
                pulling = false;
            }, { passive: true });
        },

        get personalStats() {
            const readEntries = Object.entries(this.readArticles);
            const totalRead = readEntries.length;

            const dailyCounts = {};
            const now = new Date();
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const key = d.toISOString().slice(0, 10);
                dailyCounts[key] = 0;
            }
            readEntries.forEach(([, readAt]) => {
                const day = new Date(readAt).toISOString().slice(0, 10);
                if (dailyCounts[day] !== undefined) dailyCounts[day]++;
            });

            const sourceCounts = {};
            Object.values(this.readArticlesDetails).forEach(n => {
                const src = n.source || 'Inconnu';
                if (!sourceCounts[src]) {
                    sourceCounts[src] = { count: 0, url: n.url };
                }
                sourceCounts[src].count++;
            });
            const topSources = Object.entries(sourceCounts).sort((a, b) => b[1].count - a[1].count).slice(0, 5);

            const tagCounts = {};
            Object.values(this.readArticlesDetails).forEach(n => {
                this.visibleTags(n).forEach(t => {
                    tagCounts[t] = (tagCounts[t] || 0) + 1;
                });
            });
            const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

            const maxDaily = Math.max(...Object.values(dailyCounts), 1);

            return {
                totalRead,
                bookmarksCount: this.bookmarksCount,
                dailyCounts,
                maxDaily,
                topSources,
                topTags
            };
        },

        getDayLabel(dateStr) {
            const d = new Date(dateStr);
            const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
            return days[d.getDay()];
        },

        get sourcesDetail() {
            if (this.sourceStats.length > 0) {
                return this.sourceStats.map(item => [item.source, { count: item.count, url: item.url }]);
            }
            const counts = {};
            this.newsList.forEach(n => {
                const src = n.source || 'Inconnu';
                if (!counts[src]) {
                    counts[src] = { count: 0, url: n.url };
                }
                counts[src].count++;
            });
            return Object.entries(counts).sort((a, b) => b[1].count - a[1].count);
        },

        getZoneLabel(news = {}) {
            return ZONE_PRESENTATION[news.territory_zone]?.label || news.locality || news.category || 'Pyrénées';
        },

        getZoneStyle(news = {}) {
            const color = ZONE_PRESENTATION[news.territory_zone]?.color || '#0A84FF';
            return `color:${color}; background:${color}1F; border:1px solid ${color}33`;
        },

        getFilterLabel(filter) {
            return ZONE_PRESENTATION[filter]?.label || filter;
        },

        updateEditionMetadata() {
            const title = this.isLocalEdition
                ? 'Infodrop Pyrénées · Actualités locales des dernières 24 heures'
                : 'Infodrop · Actualités nationales et internationales des dernières 24 heures';
            const description = this.isLocalEdition
                ? 'Flux public H24 des Pyrénées, des Hautes-Pyrénées, du sud de la Haute-Garonne et du Val d’Aran.'
                : 'Flux public H24 d’actualités nationales et internationales issues de dizaines de sources.';
            document.title = title;
            document.querySelector('meta[name="description"]')?.setAttribute('content', description);
            document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
            document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
            document.querySelector('meta[property="og:url"]')?.setAttribute('content', window.location.href);
            document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
            document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
        },

        async logout() {
            if (this.realtimeChannel) await this.realtimeChannel.untrack();
            await supabaseClient.auth.signOut();
            window.location.reload();
        },

        get emptyStateMessage() {
            if (this.dataError) return 'Le flux est momentanément indisponible. Réessayez dans quelques instants.';
            return this.isLocalEdition
                ? 'Aucune actualité locale publiée ces dernières 24 heures.'
                : 'Aucune actualité pour le moment.';
        },

        startAutoUpdate() {
            if (this.updateInterval) clearInterval(this.updateInterval);
            this.updateInterval = setInterval(() => {
                if (!document.hidden) this.loadNews(this.activeFilter, false);
            }, 30000);
        },

        stopAutoUpdate() {
            if (this.updateInterval) { clearInterval(this.updateInterval); this.updateInterval = null; }
        },

        formatTime(t) {
            const diffMs = new Date() - new Date(t);
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 60) return diffMins <= 0 ? "À l'instant" : `Il y a ${diffMins} min`;
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `Il y a ${diffHours} h`;
            return new Date(t).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        },

        getFavicon(urlStr) {
            if (!urlStr) return '';
            try {
                const url = new URL(urlStr);
                return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
            } catch (e) {
                return '';
            }
        },

    };
}

export { infodropApp };

const { CosmosClient } = require('@azure/cosmos');
const { DefaultAzureCredential } = require('@azure/identity');

class CosmosService {
    constructor() {
        this.endpoint = process.env.AZURE_COSMOS_ENDPOINT;
        
        // Check if we're in local development mode
        const isLocalDev = !process.env.AZURE_FUNCTIONS_ENVIRONMENT || process.env.AZURE_FUNCTIONS_ENVIRONMENT === 'Development';
        const hasRealEndpoint = this.endpoint && this.endpoint !== 'https://your-cosmos-db.documents.azure.com:443/';
        
        if (isLocalDev && !hasRealEndpoint) {
            // Local development mode - use in-memory storage
            this.isLocalMode = true;
            this.localStorage = new Map();
            console.log('Cosmos service running in local mock mode');
        } else {
            // Production mode - use real Cosmos DB with managed identity
            this.isLocalMode = false;
            const credential = new DefaultAzureCredential();
            this.client = new CosmosClient({
                endpoint: this.endpoint,
                aadCredentials: credential
            });
            
            this.database = this.client.database('socialmedia');
            this.preferencesContainer = this.database.container('preferences');
            this.generationsContainer = this.database.container('generations');
        }
    }

    // Local storage helpers for development
    getLocalKey(key, userId) {
        return `${userId}:${key}`;
    }

    // User preferences (selected platforms)
    async getUserPreferences(userId = 'default') {
        if (this.isLocalMode) {
            const key = this.getLocalKey('selected-platforms', userId);
            return this.localStorage.get(key) || [];
        }
        
        try {
            const { resource } = await this.preferencesContainer
                .item('selected-platforms', userId)
                .read();
            return resource?.value || [];
        } catch (error) {
            if (error.code === 404) {
                return []; // Return default empty array
            }
            console.error('Error getting user preferences:', error);
            throw error;
        }
    }

    async setUserPreferences(userId = 'default', platforms) {
        if (this.isLocalMode) {
            const key = this.getLocalKey('selected-platforms', userId);
            this.localStorage.set(key, platforms);
            return platforms;
        }
        
        try {
            const item = {
                id: 'selected-platforms',
                userId: userId,
                value: platforms,
                timestamp: new Date().toISOString()
            };
            
            const { resource } = await this.preferencesContainer.items.upsert(item);
            return resource.value;
        } catch (error) {
            console.error('Error setting user preferences:', error);
            throw error;
        }
    }

    // Saved generations
    async getSavedGenerations(userId = 'default') {
        if (this.isLocalMode) {
            const key = this.getLocalKey('saved-generations', userId);
            return this.localStorage.get(key) || [];
        }
        
        try {
            const querySpec = {
                query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.timestamp DESC',
                parameters: [{ name: '@userId', value: userId }]
            };
            
            const { resources } = await this.generationsContainer.items
                .query(querySpec)
                .fetchAll();
            
            return resources.map(r => r.value || r);
        } catch (error) {
            console.error('Error getting saved generations:', error);
            throw error;
        }
    }

    async addSavedGeneration(userId = 'default', generation) {
        if (this.isLocalMode) {
            const key = this.getLocalKey('saved-generations', userId);
            const existing = this.localStorage.get(key) || [];
            const newGeneration = {
                ...generation,
                id: `gen-${Date.now()}`,
                timestamp: new Date().toISOString()
            };
            existing.unshift(newGeneration);
            this.localStorage.set(key, existing);
            return newGeneration;
        }
        
        try {
            const item = {
                id: `generation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                userId: userId,
                value: generation,
                timestamp: new Date().toISOString()
            };
            
            const { resource } = await this.generationsContainer.items.create(item);
            return resource.value;
        } catch (error) {
            console.error('Error adding saved generation:', error);
            throw error;
        }
    }

    async setSavedGenerations(userId = 'default', generations) {
        if (this.isLocalMode) {
            const key = this.getLocalKey('saved-generations', userId);
            this.localStorage.set(key, generations);
            return generations;
        }
        
        try {
            // For simplicity, we'll store as a single document
            // In production, you might want individual documents for each generation
            const item = {
                id: 'saved-generations',
                userId: userId,
                value: generations,
                timestamp: new Date().toISOString()
            };
            
            const { resource } = await this.generationsContainer.items.upsert(item);
            return resource.value;
        } catch (error) {
            console.error('Error setting saved generations:', error);
            throw error;
        }
    }

    // Generic key-value operations for backward compatibility
    async getValue(key, userId = 'default') {
        if (this.isLocalMode) {
            const localKey = this.getLocalKey(key, userId);
            return this.localStorage.get(localKey) || null;
        }
        
        try {
            if (key === 'selected-platforms') {
                return await this.getUserPreferences(userId);
            } else if (key === 'saved-generations') {
                return await this.getSavedGenerations(userId);
            }
            
            // Generic lookup in preferences container
            const { resource } = await this.preferencesContainer
                .item(key, userId)
                .read();
            return resource?.value;
        } catch (error) {
            if (error.code === 404) {
                return null;
            }
            throw error;
        }
    }

    async setValue(key, value, userId = 'default') {
        if (this.isLocalMode) {
            const localKey = this.getLocalKey(key, userId);
            this.localStorage.set(localKey, value);
            return value;
        }
        
        try {
            if (key === 'selected-platforms') {
                return await this.setUserPreferences(userId, value);
            } else if (key === 'saved-generations') {
                return await this.setSavedGenerations(userId, value);
            }
            
            // Generic set in preferences container
            const item = {
                id: key,
                userId: userId,
                value: value,
                timestamp: new Date().toISOString()
            };
            
            const { resource } = await this.preferencesContainer.items.upsert(item);
            return resource.value;
        } catch (error) {
            throw error;
        }
    }

    async deleteValue(key, userId = 'default') {
        if (this.isLocalMode) {
            const localKey = this.getLocalKey(key, userId);
            const existed = this.localStorage.has(localKey);
            this.localStorage.delete(localKey);
            return existed;
        }
        
        try {
            await this.preferencesContainer.item(key, userId).delete();
            return true;
        } catch (error) {
            if (error.code === 404) {
                return false; // Already doesn't exist
            }
            throw error;
        }
    }
}

const cosmosService = new CosmosService();
module.exports = { cosmosService };
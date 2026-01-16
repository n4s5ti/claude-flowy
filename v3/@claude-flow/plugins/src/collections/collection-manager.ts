/**
 * Plugin Collection Manager
 *
 * Manages collections of plugins with activation/deactivation,
 * category filtering, and state persistence.
 */

import type { IPlugin, PluginFactory } from '../core/plugin-interface.js';
import type { PluginConfig } from '../types/index.js';
import { PluginRegistry } from '../registry/plugin-registry.js';

// ============================================================================
// Types
// ============================================================================

export type PluginCategory =
  | 'agent'        // Agent types and definitions
  | 'task'         // Task types and handlers
  | 'tool'         // MCP tools
  | 'memory'       // Memory backends
  | 'provider'     // LLM providers
  | 'hook'         // Lifecycle hooks
  | 'worker'       // Background workers
  | 'integration'  // External integrations
  | 'utility';     // General utilities

export type PluginCapability =
  | 'network'      // Can make network requests
  | 'filesystem'   // Can access filesystem
  | 'subprocess'   // Can spawn processes
  | 'memory'       // Can store persistent data
  | 'llm'          // Can call LLM APIs
  | 'mcp';         // Can register MCP tools

export interface PluginCollectionEntry {
  readonly plugin: IPlugin | PluginFactory;
  readonly defaultEnabled: boolean;
  readonly category: PluginCategory;
  readonly tags?: string[];
  readonly requiredCapabilities?: PluginCapability[];
  readonly description?: string;
}

export interface PluginCollection {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly author?: string;
  readonly license?: string;
  readonly repository?: string;
  readonly categories?: PluginCategory[];
  readonly plugins: PluginCollectionEntry[];
}

export interface CollectionManagerState {
  version: string;
  collections: string[];
  enabledPlugins: Record<string, string[]>;  // collectionId -> pluginNames
  disabledPlugins: Record<string, string[]>; // collectionId -> pluginNames (overrides default)
  pluginSettings: Record<string, Record<string, unknown>>; // pluginName -> settings
}

export interface CollectionManagerConfig {
  registry: PluginRegistry;
  autoInitialize?: boolean;
  stateFile?: string;
}

export interface CollectionStats {
  totalCollections: number;
  totalPlugins: number;
  enabledPlugins: number;
  disabledPlugins: number;
  byCategory: Record<PluginCategory, number>;
}

// ============================================================================
// Collection Manager
// ============================================================================

/**
 * Manages plugin collections with activation/deactivation and persistence.
 *
 * Features:
 * - Load/unload plugin collections
 * - Enable/disable individual plugins
 * - Category-based filtering
 * - Tag-based search
 * - State persistence
 * - Bulk operations
 */
export class PluginCollectionManager {
  private collections = new Map<string, PluginCollection>();
  private enabledOverrides = new Map<string, Set<string>>();  // Explicitly enabled
  private disabledOverrides = new Map<string, Set<string>>(); // Explicitly disabled
  private pluginSettings = new Map<string, Record<string, unknown>>();
  private registry: PluginRegistry;
  private autoInitialize: boolean;

  constructor(config: CollectionManagerConfig) {
    this.registry = config.registry;
    this.autoInitialize = config.autoInitialize ?? true;
  }

  // =========================================================================
  // Collection Management
  // =========================================================================

  /**
   * Load a plugin collection.
   */
  async loadCollection(collection: PluginCollection): Promise<void> {
    if (this.collections.has(collection.id)) {
      throw new Error(`Collection ${collection.id} already loaded`);
    }

    this.collections.set(collection.id, collection);
    this.enabledOverrides.set(collection.id, new Set());
    this.disabledOverrides.set(collection.id, new Set());

    // Register enabled plugins
    for (const entry of collection.plugins) {
      if (this.isPluginEnabled(collection.id, entry)) {
        await this.registerPlugin(entry);
      }
    }
  }

  /**
   * Unload a plugin collection.
   */
  async unloadCollection(collectionId: string): Promise<void> {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    // Unregister all plugins from this collection
    for (const entry of collection.plugins) {
      const plugin = await this.resolvePlugin(entry.plugin);
      const name = plugin.metadata.name;

      if (this.registry.getPlugin(name)) {
        try {
          await this.registry.unregister(name);
        } catch {
          // Ignore errors during unload
        }
      }
    }

    this.collections.delete(collectionId);
    this.enabledOverrides.delete(collectionId);
    this.disabledOverrides.delete(collectionId);
  }

  /**
   * List all loaded collections.
   */
  listCollections(): PluginCollection[] {
    return Array.from(this.collections.values());
  }

  /**
   * Get a collection by ID.
   */
  getCollection(id: string): PluginCollection | undefined {
    return this.collections.get(id);
  }

  // =========================================================================
  // Plugin Activation
  // =========================================================================

  /**
   * Enable a plugin from a collection.
   */
  async enablePlugin(collectionId: string, pluginName: string): Promise<void> {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    const entry = this.findPluginEntry(collection, pluginName);
    if (!entry) {
      throw new Error(`Plugin ${pluginName} not found in collection ${collectionId}`);
    }

    // Remove from disabled, add to enabled
    this.disabledOverrides.get(collectionId)?.delete(pluginName);
    this.enabledOverrides.get(collectionId)?.add(pluginName);

    // Register if not already registered
    const plugin = await this.resolvePlugin(entry.plugin);
    if (!this.registry.getPlugin(plugin.metadata.name)) {
      await this.registerPlugin(entry);
    }
  }

  /**
   * Disable a plugin from a collection.
   */
  async disablePlugin(collectionId: string, pluginName: string): Promise<void> {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    const entry = this.findPluginEntry(collection, pluginName);
    if (!entry) {
      throw new Error(`Plugin ${pluginName} not found in collection ${collectionId}`);
    }

    // Remove from enabled, add to disabled
    this.enabledOverrides.get(collectionId)?.delete(pluginName);
    this.disabledOverrides.get(collectionId)?.add(pluginName);

    // Unregister if registered
    const plugin = await this.resolvePlugin(entry.plugin);
    if (this.registry.getPlugin(plugin.metadata.name)) {
      try {
        await this.registry.unregister(plugin.metadata.name);
      } catch {
        // May fail if other plugins depend on it
        throw new Error(`Cannot disable ${pluginName}: other plugins may depend on it`);
      }
    }
  }

  /**
   * Check if a plugin is enabled.
   */
  isEnabled(collectionId: string, pluginName: string): boolean {
    const collection = this.collections.get(collectionId);
    if (!collection) return false;

    const entry = this.findPluginEntry(collection, pluginName);
    if (!entry) return false;

    return this.isPluginEnabled(collectionId, entry);
  }

  /**
   * Toggle a plugin's enabled state.
   */
  async togglePlugin(collectionId: string, pluginName: string): Promise<boolean> {
    if (this.isEnabled(collectionId, pluginName)) {
      await this.disablePlugin(collectionId, pluginName);
      return false;
    } else {
      await this.enablePlugin(collectionId, pluginName);
      return true;
    }
  }

  // =========================================================================
  // Bulk Operations
  // =========================================================================

  /**
   * Enable all plugins in a collection.
   */
  async enableAll(collectionId: string): Promise<void> {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    for (const entry of collection.plugins) {
      const plugin = await this.resolvePlugin(entry.plugin);
      await this.enablePlugin(collectionId, plugin.metadata.name);
    }
  }

  /**
   * Disable all plugins in a collection.
   */
  async disableAll(collectionId: string): Promise<void> {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new Error(`Collection ${collectionId} not found`);
    }

    // Disable in reverse order to handle dependencies
    const entries = [...collection.plugins].reverse();
    for (const entry of entries) {
      const plugin = await this.resolvePlugin(entry.plugin);
      try {
        await this.disablePlugin(collectionId, plugin.metadata.name);
      } catch {
        // Continue disabling others
      }
    }
  }

  /**
   * Enable all plugins in a category across all collections.
   */
  async enableCategory(category: PluginCategory): Promise<void> {
    for (const [collectionId, collection] of this.collections) {
      for (const entry of collection.plugins) {
        if (entry.category === category) {
          const plugin = await this.resolvePlugin(entry.plugin);
          try {
            await this.enablePlugin(collectionId, plugin.metadata.name);
          } catch {
            // Continue with others
          }
        }
      }
    }
  }

  /**
   * Disable all plugins in a category across all collections.
   */
  async disableCategory(category: PluginCategory): Promise<void> {
    for (const [collectionId, collection] of this.collections) {
      const entries = [...collection.plugins].reverse();
      for (const entry of entries) {
        if (entry.category === category) {
          const plugin = await this.resolvePlugin(entry.plugin);
          try {
            await this.disablePlugin(collectionId, plugin.metadata.name);
          } catch {
            // Continue with others
          }
        }
      }
    }
  }

  // =========================================================================
  // Filtering & Search
  // =========================================================================

  /**
   * Get all plugins by category.
   */
  getPluginsByCategory(category: PluginCategory): Array<{
    collectionId: string;
    entry: PluginCollectionEntry;
    enabled: boolean;
  }> {
    const results: Array<{
      collectionId: string;
      entry: PluginCollectionEntry;
      enabled: boolean;
    }> = [];

    for (const [collectionId, collection] of this.collections) {
      for (const entry of collection.plugins) {
        if (entry.category === category) {
          results.push({
            collectionId,
            entry,
            enabled: this.isPluginEnabled(collectionId, entry),
          });
        }
      }
    }

    return results;
  }

  /**
   * Get all plugins by tag.
   */
  getPluginsByTag(tag: string): Array<{
    collectionId: string;
    entry: PluginCollectionEntry;
    enabled: boolean;
  }> {
    const results: Array<{
      collectionId: string;
      entry: PluginCollectionEntry;
      enabled: boolean;
    }> = [];

    for (const [collectionId, collection] of this.collections) {
      for (const entry of collection.plugins) {
        if (entry.tags?.includes(tag)) {
          results.push({
            collectionId,
            entry,
            enabled: this.isPluginEnabled(collectionId, entry),
          });
        }
      }
    }

    return results;
  }

  /**
   * Search plugins by name or description.
   */
  async searchPlugins(query: string): Promise<Array<{
    collectionId: string;
    entry: PluginCollectionEntry;
    pluginName: string;
    enabled: boolean;
    score: number;
  }>> {
    const results: Array<{
      collectionId: string;
      entry: PluginCollectionEntry;
      pluginName: string;
      enabled: boolean;
      score: number;
    }> = [];

    const queryLower = query.toLowerCase();

    for (const [collectionId, collection] of this.collections) {
      for (const entry of collection.plugins) {
        const plugin = await this.resolvePlugin(entry.plugin);
        const name = plugin.metadata.name.toLowerCase();
        const description = (entry.description ?? plugin.metadata.description ?? '').toLowerCase();

        let score = 0;

        // Exact name match
        if (name === queryLower) score += 100;
        // Name contains query
        else if (name.includes(queryLower)) score += 50;

        // Description contains query
        if (description.includes(queryLower)) score += 25;

        // Tag match
        if (entry.tags?.some(t => t.toLowerCase().includes(queryLower))) {
          score += 30;
        }

        // Category match
        if (entry.category.toLowerCase().includes(queryLower)) {
          score += 20;
        }

        if (score > 0) {
          results.push({
            collectionId,
            entry,
            pluginName: plugin.metadata.name,
            enabled: this.isPluginEnabled(collectionId, entry),
            score,
          });
        }
      }
    }

    // Sort by score descending
    return results.sort((a, b) => b.score - a.score);
  }

  // =========================================================================
  // Settings
  // =========================================================================

  /**
   * Get settings for a plugin.
   */
  getPluginSettings(pluginName: string): Record<string, unknown> {
    return this.pluginSettings.get(pluginName) ?? {};
  }

  /**
   * Set settings for a plugin.
   */
  setPluginSettings(pluginName: string, settings: Record<string, unknown>): void {
    this.pluginSettings.set(pluginName, settings);
  }

  /**
   * Update settings for a plugin (merge with existing).
   */
  updatePluginSettings(pluginName: string, settings: Record<string, unknown>): void {
    const existing = this.pluginSettings.get(pluginName) ?? {};
    this.pluginSettings.set(pluginName, { ...existing, ...settings });
  }

  // =========================================================================
  // State Persistence
  // =========================================================================

  /**
   * Export current state.
   */
  exportState(): CollectionManagerState {
    const enabledPlugins: Record<string, string[]> = {};
    const disabledPlugins: Record<string, string[]> = {};

    for (const [collectionId, enabled] of this.enabledOverrides) {
      if (enabled.size > 0) {
        enabledPlugins[collectionId] = Array.from(enabled);
      }
    }

    for (const [collectionId, disabled] of this.disabledOverrides) {
      if (disabled.size > 0) {
        disabledPlugins[collectionId] = Array.from(disabled);
      }
    }

    const pluginSettingsObj: Record<string, Record<string, unknown>> = {};
    for (const [name, settings] of this.pluginSettings) {
      pluginSettingsObj[name] = settings;
    }

    return {
      version: '1.0.0',
      collections: Array.from(this.collections.keys()),
      enabledPlugins,
      disabledPlugins,
      pluginSettings: pluginSettingsObj,
    };
  }

  /**
   * Import state (does not load collections, just restores overrides).
   */
  importState(state: CollectionManagerState): void {
    // Restore enabled overrides
    for (const [collectionId, plugins] of Object.entries(state.enabledPlugins)) {
      this.enabledOverrides.set(collectionId, new Set(plugins));
    }

    // Restore disabled overrides
    for (const [collectionId, plugins] of Object.entries(state.disabledPlugins)) {
      this.disabledOverrides.set(collectionId, new Set(plugins));
    }

    // Restore plugin settings
    for (const [name, settings] of Object.entries(state.pluginSettings)) {
      this.pluginSettings.set(name, settings);
    }
  }

  /**
   * Save state to a JSON file.
   */
  async saveState(path: string): Promise<void> {
    const fs = await import('fs/promises');
    const state = this.exportState();
    await fs.writeFile(path, JSON.stringify(state, null, 2), 'utf-8');
  }

  /**
   * Load state from a JSON file.
   */
  async loadState(path: string): Promise<void> {
    const fs = await import('fs/promises');
    const content = await fs.readFile(path, 'utf-8');
    const state = JSON.parse(content) as CollectionManagerState;
    this.importState(state);
  }

  // =========================================================================
  // Statistics
  // =========================================================================

  /**
   * Get collection statistics.
   */
  async getStats(): Promise<CollectionStats> {
    const byCategory: Record<PluginCategory, number> = {
      agent: 0,
      task: 0,
      tool: 0,
      memory: 0,
      provider: 0,
      hook: 0,
      worker: 0,
      integration: 0,
      utility: 0,
    };

    let totalPlugins = 0;
    let enabledPlugins = 0;
    let disabledPlugins = 0;

    for (const [collectionId, collection] of this.collections) {
      for (const entry of collection.plugins) {
        totalPlugins++;
        byCategory[entry.category]++;

        if (this.isPluginEnabled(collectionId, entry)) {
          enabledPlugins++;
        } else {
          disabledPlugins++;
        }
      }
    }

    return {
      totalCollections: this.collections.size,
      totalPlugins,
      enabledPlugins,
      disabledPlugins,
      byCategory,
    };
  }

  // =========================================================================
  // Private Helpers
  // =========================================================================

  private async resolvePlugin(plugin: IPlugin | PluginFactory): Promise<IPlugin> {
    return typeof plugin === 'function' ? await plugin() : plugin;
  }

  private async findPluginEntry(
    collection: PluginCollection,
    pluginName: string
  ): Promise<PluginCollectionEntry | undefined> {
    for (const entry of collection.plugins) {
      const plugin = await this.resolvePlugin(entry.plugin);
      if (plugin.metadata.name === pluginName) {
        return entry;
      }
    }
    return undefined;
  }

  private async isPluginEnabled(
    collectionId: string,
    entry: PluginCollectionEntry
  ): Promise<boolean> {
    const plugin = await this.resolvePlugin(entry.plugin);
    const name = plugin.metadata.name;

    // Check explicit overrides first
    if (this.enabledOverrides.get(collectionId)?.has(name)) {
      return true;
    }
    if (this.disabledOverrides.get(collectionId)?.has(name)) {
      return false;
    }

    // Fall back to default
    return entry.defaultEnabled;
  }

  private async registerPlugin(entry: PluginCollectionEntry): Promise<void> {
    const plugin = await this.resolvePlugin(entry.plugin);
    const settings = this.pluginSettings.get(plugin.metadata.name);

    const config: Partial<PluginConfig> = {
      enabled: true,
      settings: settings ?? {},
    };

    await this.registry.register(plugin, config);

    if (this.autoInitialize) {
      // Plugin will be initialized when registry.initialize() is called
    }
  }
}

// ============================================================================
// Default Instance
// ============================================================================

let defaultManager: PluginCollectionManager | null = null;

export function getDefaultCollectionManager(): PluginCollectionManager | null {
  return defaultManager;
}

export function setDefaultCollectionManager(manager: PluginCollectionManager): void {
  defaultManager = manager;
}

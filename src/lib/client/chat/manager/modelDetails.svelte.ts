// src/lib/client/chat/manager/modelDetails.svelte.ts
import { NDKEvent, NDKSubscription, NDKSubscriptionCacheUsage, type NDKFilter, type NDKSubscriptionOptions } from '@nostr-dev-kit/ndk';
import { getNDK } from '$lib/client/stores/nostr';
import type { ModelPublicationDetails, ModelsPublicationData } from '$lib/types';
import { createDebug } from '$lib/utils/debug';

const d = createDebug('models:details');

// Define constants for the models event
const MODELS_EVENT_KIND = 30078;
const MODELS_EVENT_D_TAG = 'cypherflow-ai-models-config';

// Global reactive state for model details
export let modelDetailsState = $state<{
    availableModels: ModelPublicationDetails[];
    lastModelUpdateTimestamp: number | null;
    btcUsdRate: number | null;
    isLoading: boolean;
    error: string | null;
    subscription: NDKSubscription | null;
}>({
    availableModels: [],
    lastModelUpdateTimestamp: null,
    btcUsdRate: null,
    isLoading: false,
    error: null,
    subscription: null
});

/**
 * Initialize model details subscription
 */
export function initModelDetails(): void {
    try {
        d.log('[INIT] Initializing model details subscription');
        modelDetailsState.isLoading = true;
        setupModelDetailsSubscription();
        d.log('[INIT] Model details initialization complete');
    } catch (error) {
        modelDetailsState.error = error instanceof Error ? error.message : 'Failed to initialize model details';
        d.error('[INIT] Failed to initialize model details:', error);
    } finally {
        modelDetailsState.isLoading = false;
    }
}

/**
 * Set up subscription for model details events
 */
function setupModelDetailsSubscription(): void {
    const ndk = getNDK();
    if (!ndk) {
        d.error('[SETUP] NDK not initialized');
        throw new Error('NDK not initialized');
    }

    // Create filter for model details events
    const filter: NDKFilter = {
        kinds: [MODELS_EVENT_KIND],
        '#d': [MODELS_EVENT_D_TAG]
    };

    // Set up subscription options
    const opts: NDKSubscriptionOptions = {
        subId: 'model-details',
        closeOnEose: false, // Keep listening for updates
        cacheUsage: NDKSubscriptionCacheUsage.PARALLEL, // Use cache in parallel with relays
    };

    d.log('[SETUP] Creating model details subscription with filter');

    // Create subscription
    const subscription = ndk.subscribe(filter, opts);

    // Handle events from both cache and relays
    subscription.on('event', async (event: NDKEvent, _relay: any, _subscription: any, fromCache: boolean) => {
        d.log(`[EVENT] Received model details event from ${fromCache ? 'cache' : 'relay'}`);
        await handleModelDetailsEvent(event);
    });

    // Start the subscription
    subscription.start();
    
    // Store the subscription reference
    modelDetailsState.subscription = subscription;
    
    d.log('[SETUP] Model details subscription started');
}

/**
 * Handle incoming model details events
 */
async function handleModelDetailsEvent(event: NDKEvent): Promise<void> {
    try {
        if (!event.content) {
            d.warn('[HANDLE] Empty model details event content');
            return;
        }

        const modelsData = JSON.parse(event.content) as ModelsPublicationData;
        d.log(`[HANDLE] Parsed model details: ${modelsData.models.length} models available`);
        
        // Log detailed model information
        modelsData.models.forEach(model => {
            d.log(`[HANDLE] Model details for ${model.id}:`, {
                prompt_tokens_per_sat: model.prompt_tokens_per_sat,
                completion_tokens_per_sat: model.completion_tokens_per_sat,
                max_output_tokens: model.max_output_tokens,
                architecture: model.architecture
            });
        });

        // Update state with the new data
        modelDetailsState.availableModels = modelsData.models;
        modelDetailsState.lastModelUpdateTimestamp = modelsData.updated_at;
        modelDetailsState.btcUsdRate = modelsData.btc_usd_rate;
        modelDetailsState.error = null; // Clear any previous errors

        d.log('[HANDLE] Updated model details', {
            modelsCount: modelsData.models.length,
            timestamp: new Date(modelsData.updated_at * 1000).toISOString(),
            btcRate: modelsData.btc_usd_rate
        });
    } catch (error) {
        d.error('[HANDLE] Failed to process model details event:', error);
        modelDetailsState.error = 'Failed to process model details';
    }
}

/**
 * Get model details by ID
 */
export function getModelById(modelId: string): ModelPublicationDetails | undefined {
    if (!modelId) {
        d.warn('[GET_MODEL] No model ID provided');
        return undefined;
    }
    
    if (!modelDetailsState.availableModels || modelDetailsState.availableModels.length === 0) {
        d.warn('[GET_MODEL] Available models array is empty');
        return undefined;
    }
    
    const model = modelDetailsState.availableModels.find((model) => model.id === modelId);
    
    if (model) {
        d.log(`[GET_MODEL] Found model: ${model.id}`, {
            prompt_tokens_per_sat: model.prompt_tokens_per_sat,
            completion_tokens_per_sat: model.completion_tokens_per_sat,
            max_output_tokens: model.max_output_tokens
        });
    } else {
        d.warn(`[GET_MODEL] Model not found with ID: ${modelId}`);
        d.log('[GET_MODEL] Available models:', modelDetailsState.availableModels.map(m => m.id));
    }
    
    return model;
}

/**
 * Refresh model details by restarting the subscription
 */
export async function refreshModelDetails(): Promise<void> {
    d.log('[REFRESH] Refreshing model details subscription');
    // Stop existing subscription if any
    if (modelDetailsState.subscription) {
        d.log('[REFRESH] Stopping existing subscription');
        modelDetailsState.subscription.stop();
        modelDetailsState.subscription = null;
    }
    
    // Reinitialize
    initModelDetails();
    d.log('[REFRESH] Model details refreshed');
}

/**
 * Clean up subscription
 */
export function destroyModelDetails(): void {
    if (modelDetailsState.subscription) {
        d.log('[DESTROY] Destroying model details subscription');
        modelDetailsState.subscription.stop();
        modelDetailsState.subscription = null;
    }
    d.log('[DESTROY] Model details subscription destroyed');
}

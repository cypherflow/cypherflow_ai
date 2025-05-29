// src/lib/client/utils/deposit.ts
import type { Message } from '@ai-sdk/ui-utils';
import type { ModelPublicationDetails } from '$lib/types';
import { createDebug } from '$lib/utils/debug';
import { getModelById } from '../chat/manager/modelDetails.svelte';

// Create a single debug logger for deposit calculations
const d = createDebug('chat:deposit');

/**
 * Simple heuristic to estimate token count from text
 * Uses the 4 characters per token approximation
 * @param text Text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  
  // Simple heuristic: 4 characters ≈ 1 token
  const characterCount = text.length;
  const tokenEstimate = Math.ceil(characterCount / 4);
  
  d.log(`Token estimation: ${characterCount} chars ≈ ${tokenEstimate} tokens`);
  return tokenEstimate;
}

/**
 * Estimate token count for an array of messages
 * @param messages Array of messages to estimate tokens for
 * @returns Estimated token count
 */
export function estimateMessagesTokenCount(messages: Message[]): number {
  // Convert messages to string to estimate token usage
  const messagesString = JSON.stringify(messages);
  const charCount = messagesString.length;
  const tokenEstimate = Math.ceil(charCount / 4);
  
  d.log(`Message token estimation: ${messages.length} messages, ${charCount} chars ≈ ${tokenEstimate} tokens`);
  return tokenEstimate;
}

/**
 * Calculate the required deposit amount in satoshis for a request
 * @param model Model configuration with pricing information
 * @param messages Array of input messages
 * @returns Required deposit amount in satoshis
 */
export function calculateRequiredDeposit(
  model: ModelPublicationDetails,
  messages: Message[]
): number {
  if (!model) {
    d.error("[DEPOSIT] Model configuration not provided");
    throw new Error("Model configuration not provided");
  }
  
  d.log(`[DEPOSIT] Calculating deposit for model: ${model.id}`);
  d.log(`[DEPOSIT] Model details:`, {
    prompt_tokens_per_sat: model.prompt_tokens_per_sat,
    completion_tokens_per_sat: model.completion_tokens_per_sat,
    max_output_tokens: model.max_output_tokens
  });
  
  // Step 1: Estimate input tokens from messages
  const estimatedInputTokens = estimateMessagesTokenCount(messages);
  
  // Step 2: Calculate input cost (raw value, not rounded yet)
  const rawInputCost = estimatedInputTokens / model.prompt_tokens_per_sat;
  
  // Step 3: Calculate maximum possible output cost (raw value, not rounded yet)
  const maxOutputTokens = model.max_output_tokens;
  const rawOutputCost = maxOutputTokens / model.completion_tokens_per_sat;
  
  // Step 4: The total deposit is the sum of input cost and max possible output cost, THEN rounded up
  const totalDeposit = Math.ceil(rawInputCost + rawOutputCost);
  
  // Log the calculation for debugging
  d.log(`[DEPOSIT] Calculation steps for model ${model.id}:`);
  d.log(`[DEPOSIT] - Estimated input tokens: ${estimatedInputTokens}`);
  d.log(`[DEPOSIT] - Input cost (raw): ${rawInputCost.toFixed(4)} sats (${model.prompt_tokens_per_sat} tokens per sat)`);
  d.log(`[DEPOSIT] - Max output tokens: ${maxOutputTokens}`);
  d.log(`[DEPOSIT] - Max output cost (raw): ${rawOutputCost.toFixed(4)} sats (${model.completion_tokens_per_sat} tokens per sat)`);
  d.log(`[DEPOSIT] - Total required deposit (rounded up): ${totalDeposit} sats`);
  
  // Special debug for low deposit values
  if (totalDeposit <= 1) {
    d.warn(`[DEPOSIT] Very low deposit calculated (${totalDeposit}). Possible calculation issue?`);
    d.warn(`[DEPOSIT] Check if model properties are valid:`, {
      prompt_tokens_per_sat: model.prompt_tokens_per_sat,
      completion_tokens_per_sat: model.completion_tokens_per_sat,
      max_output_tokens: model.max_output_tokens
    });
  }
  
  // Ensure minimum deposit amount (1 sat)
  return Math.max(1, totalDeposit);
}

/**
 * Calculate the maximum input characters based on model config
 * Estimates how many characters a user can input before hitting token limits
 * @param modelId The model ID to check
 * @returns Maximum input characters
 */
export function calculateMaxInputChars(modelId: string): number {
  if (!modelId) {
    d.warn('[MAX_CHARS] No modelId provided for max input calculation, using default');
    return 8000; // Default fallback
  }
  
  // Get the model configuration from the model details store
  const model = getModelById(modelId);
  if (!model) {
    d.warn(`[MAX_CHARS] Model ${modelId} not found, using default max chars of 8000`);
    return 8000; // Fallback if model not found
  }
  
  // Use the model's max_input_tokens if available
  if (model.max_input_tokens) {
    // Convert tokens to characters (approximately)
    const maxChars = model.max_input_tokens * 4;
    d.log(`[MAX_CHARS] Max input chars for ${modelId}: ${maxChars} (based on ${model.max_input_tokens} tokens)`);
    return maxChars;
  }
  
  // Fallback to a reasonable default
  d.warn(`[MAX_CHARS] No max_input_tokens defined for ${modelId}, using default of 8000 chars`);
  return 8000;
}

/**
 * Calculate the estimated deposit amount for a set of messages and model
 * @param messages Current chat messages
 * @param modelId The selected model ID
 * @returns The estimated deposit amount in sats
 */
export function calculateCurrentDepositAmount(messages: Message[], modelId: string): number {
  d.log(`[CALCULATE] Starting deposit calculation for model: ${modelId}`);
  d.log(`[CALCULATE] Message count: ${messages?.length || 0}`);
  
  if (!modelId) {
    d.warn('[CALCULATE] No modelId provided for deposit calculation, using fallback amount');
    return 50; // Fallback minimum amount
  }
  
  if (!messages || messages.length === 0) {
    d.log('[CALCULATE] No messages to calculate deposit for, this is a new chat');
    //return 1; // Minimum amount for empty conversation
  }
  
  const model = getModelById(modelId);
  if (!model) {
    d.warn(`[CALCULATE] Model ${modelId} not found for deposit calculation, using fallback amount of 5 sats`);
    return 5; // Fallback minimum amount
  }
  
  d.log(`[CALCULATE] Model found for ${modelId}:`, {
    id: model.id,
    prompt_tokens_per_sat: model.prompt_tokens_per_sat,
    completion_tokens_per_sat: model.completion_tokens_per_sat,
    max_output_tokens: model.max_output_tokens
  });
  
  try {
    d.log(`[CALCULATE] Calculating deposit for ${messages.length} messages with model ${modelId}`);
    const depositAmount = calculateRequiredDeposit(model, messages);
    d.log(`[CALCULATE] Final calculated deposit amount: ${depositAmount} sats for model ${modelId}`);
    return depositAmount;
  } catch (error) {
    d.error('[CALCULATE] Error calculating deposit amount:', error);
    d.warn('[CALCULATE] Using fallback deposit amount of 5 sats due to calculation error');
    return 5; // Fallback minimum amount
  }
}

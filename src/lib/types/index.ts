// Types
export interface ModelPublicationDetails {
  id: string;
  name: string;
  description: string;
  max_output_tokens: number;
  max_input_tokens: number;
  prompt_tokens_per_sat: number; // Input tokens available for each sat of payment.
  completion_tokens_per_sat: number; // Output tokens available for each sat of payment.
  provider: string;
  architecture: {
    modality: string;
    input_modalities: string[];
    output_modalities: string[];
    tokenizer: string;
  }
}

export interface ModelsPublicationData {
	models: ModelPublicationDetails[];
	updated_at: number;
	btc_usd_rate: number;
}

export interface BitcoinPriceData {
	bitcoin_price_usd: number;
	updated_at: number;
}

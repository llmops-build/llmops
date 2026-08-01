/**
 * The OpenAI-compatible endpoints the gateway routes. The enum value is the
 * URL path suffix, so routing is a direct match against the request path.
 */
export enum RequestType {
  ChatCompletion = '/chat/completions',
  Completion = '/completions',
  Responses = '/responses',
  Embedding = '/embeddings',
  ImageGeneration = '/images/generations',
  ImageEdit = '/images/edits',
  ImageVariation = '/images/variations',
  Moderation = '/moderations',
  AudioTranscription = '/audio/transcriptions',
  AudioTranslation = '/audio/translations',
  AudioSpeech = '/audio/speech',
}

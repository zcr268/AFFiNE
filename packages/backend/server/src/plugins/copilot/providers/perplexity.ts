import assert from 'node:assert';

import { EventSourceParserStream } from 'eventsource-parser/stream';
import { z } from 'zod';

import {
  CopilotPromptInvalid,
  CopilotProviderSideError,
  metrics,
} from '../../../base';
import {
  CopilotCapability,
  CopilotChatOptions,
  CopilotProviderType,
  CopilotTextToTextProvider,
  PromptMessage,
} from '../types';

export type PerplexityConfig = {
  apiKey: string;
  endpoint?: string;
};

const PerplexityErrorSchema = z.union([
  z.object({
    detail: z.array(
      z.object({
        loc: z.array(z.string()),
        msg: z.string(),
        type: z.string(),
      })
    ),
  }),
  z.object({
    error: z.object({
      message: z.string(),
      type: z.string(),
      code: z.number(),
    }),
  }),
]);

const PerplexityDataSchema = z.object({
  citations: z.array(z.string()),
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string(),
        role: z.literal('assistant'),
      }),
      delta: z.object({
        content: z.string(),
        role: z.literal('assistant'),
      }),
      finish_reason: z.union([z.literal('stop'), z.literal(null)]),
    })
  ),
});

const PerplexitySchema = z.union([PerplexityDataSchema, PerplexityErrorSchema]);

type PerplexityError = z.infer<typeof PerplexityErrorSchema>;

export class CitationParser {
  private readonly SQUARE_BRACKET_OPEN = '[';

  private readonly SQUARE_BRACKET_CLOSE = ']';

  private readonly PARENTHESES_OPEN = '(';

  private startToken: string[] = [];

  private endToken: string[] = [];

  private numberToken: string[] = [];

  private citations: string[] = [];

  public parse(content: string, citations: string[]) {
    this.citations = citations;
    let result = '';
    const contentArray = content.split('');
    for (const [index, char] of contentArray.entries()) {
      if (char === this.SQUARE_BRACKET_OPEN) {
        if (this.numberToken.length === 0) {
          this.startToken.push(char);
        } else {
          result += this.flush() + char;
        }
        continue;
      }

      if (char === this.SQUARE_BRACKET_CLOSE) {
        this.endToken.push(char);
        if (this.startToken.length === this.endToken.length) {
          const cIndex = Number(this.numberToken.join('').trim());
          if (
            cIndex > 0 &&
            cIndex <= citations.length &&
            contentArray[index + 1] !== this.PARENTHESES_OPEN
          ) {
            const content = `[^${cIndex}]`;
            result += content;
            this.resetToken();
          } else {
            result += this.flush();
          }
        } else if (this.startToken.length < this.endToken.length) {
          result += this.flush();
        }
        continue;
      }

      if (this.isNumeric(char)) {
        if (this.startToken.length > 0) {
          this.numberToken.push(char);
        } else {
          result += this.flush() + char;
        }
        continue;
      }

      if (this.startToken.length > 0) {
        result += this.flush() + char;
      } else {
        result += char;
      }
    }

    return result;
  }

  public end() {
    return this.flush() + '\n' + this.getFootnotes();
  }

  private flush() {
    const content = this.getTokenContent();
    this.resetToken();
    return content;
  }

  private getFootnotes() {
    const footnotes = this.citations.map((citation, index) => {
      return `[^${index + 1}]: {"type":"url","url":"${encodeURIComponent(
        citation
      )}"}`;
    });
    return footnotes.join('\n');
  }

  private getTokenContent() {
    return this.startToken.concat(this.numberToken, this.endToken).join('');
  }

  private resetToken() {
    this.startToken = [];
    this.endToken = [];
    this.numberToken = [];
  }

  private isNumeric(str: string) {
    return !isNaN(Number(str)) && str.trim() !== '';
  }
}

export class PerplexityProvider implements CopilotTextToTextProvider {
  static readonly type = CopilotProviderType.Perplexity;

  static readonly capabilities = [CopilotCapability.TextToText];

  static assetsConfig(config: PerplexityConfig) {
    return !!config.apiKey;
  }

  constructor(private readonly config: PerplexityConfig) {
    assert(PerplexityProvider.assetsConfig(config));
  }

  readonly availableModels = [
    'sonar',
    'sonar-pro',
    'sonar-reasoning',
    'sonar-reasoning-pro',
  ];

  get type(): CopilotProviderType {
    return PerplexityProvider.type;
  }

  getCapabilities(): CopilotCapability[] {
    return PerplexityProvider.capabilities;
  }

  async isModelAvailable(model: string): Promise<boolean> {
    return this.availableModels.includes(model);
  }

  async generateText(
    messages: PromptMessage[],
    model: string = 'sonar',
    options: CopilotChatOptions = {}
  ): Promise<string> {
    await this.checkParams({ messages, model, options });
    try {
      metrics.ai.counter('chat_text_calls').add(1, { model });
      const sMessages = messages
        .map(({ content, role }) => ({ content, role }))
        .filter(({ content }) => typeof content === 'string');

      const params = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: sMessages,
          max_tokens: options.maxTokens || 4096,
        }),
      };
      const response = await fetch(
        this.config.endpoint || 'https://api.perplexity.ai/chat/completions',
        params
      );
      const data = PerplexitySchema.parse(await response.json());
      if ('detail' in data || 'error' in data) {
        throw this.convertError(data);
      } else {
        const citationParser = new CitationParser();
        const { content } = data.choices[0].message;
        const { citations } = data;
        let result = content.replaceAll(/<\/?think>\n/g, '\n---\n');
        result = citationParser.parse(result, citations);
        result += citationParser.end();
        return result;
      }
    } catch (e: any) {
      metrics.ai.counter('chat_text_errors').add(1, { model });
      throw this.handleError(e);
    }
  }

  async *generateTextStream(
    messages: PromptMessage[],
    model: string = 'sonar',
    options: CopilotChatOptions = {}
  ): AsyncIterable<string> {
    await this.checkParams({ messages, model, options });
    try {
      metrics.ai.counter('chat_text_stream_calls').add(1, { model });
      const sMessages = messages
        .map(({ content, role }) => ({ content, role }))
        .filter(({ content }) => typeof content === 'string');

      const params = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: sMessages,
          max_tokens: options.maxTokens || 4096,
          stream: true,
        }),
      };
      const response = await fetch(
        this.config.endpoint || 'https://api.perplexity.ai/chat/completions',
        params
      );
      const errorHandler = this.convertError;
      if (response.ok && response.body) {
        const citationParser = new CitationParser();
        const eventStream = response.body
          .pipeThrough(new TextDecoderStream())
          .pipeThrough(new EventSourceParserStream())
          .pipeThrough(
            new TransformStream({
              transform(chunk, controller) {
                if (options.signal?.aborted) {
                  controller.enqueue(null);
                  return;
                }
                const json = JSON.parse(chunk.data);
                if (json) {
                  const data = PerplexitySchema.parse(json);
                  if ('detail' in data || 'error' in data) {
                    throw errorHandler(data);
                  }
                  const { content } = data.choices[0].delta;
                  const { citations } = data;
                  let result = content.replaceAll(/<\/?think>\n?/g, '\n---\n');
                  result = citationParser.parse(result, citations);
                  controller.enqueue(result);
                }
              },
              flush(controller) {
                controller.enqueue(citationParser.end());
                controller.enqueue(null);
              },
            })
          );

        const reader = eventStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          yield value;
        }
      } else {
        const result = await this.generateText(messages, model, options);
        yield result;
      }
    } catch (e) {
      metrics.ai.counter('chat_text_stream_errors').add(1, { model });
      throw e;
    }
  }

  protected async checkParams({
    model,
  }: {
    messages?: PromptMessage[];
    embeddings?: string[];
    model: string;
    options: CopilotChatOptions;
  }) {
    if (!(await this.isModelAvailable(model))) {
      throw new CopilotPromptInvalid(`Invalid model: ${model}`);
    }
  }

  private convertError(e: PerplexityError) {
    function getErrMessage(e: PerplexityError) {
      let err = 'Unexpected perplexity response';
      if ('detail' in e) {
        err = e.detail[0].msg || err;
      } else if ('error' in e) {
        err = e.error.message || err;
      }
      return err;
    }

    throw new CopilotProviderSideError({
      provider: this.type,
      kind: 'unexpected_response',
      message: getErrMessage(e),
    });
  }

  private handleError(e: any) {
    if (e instanceof CopilotProviderSideError) {
      return e;
    }
    return new CopilotProviderSideError({
      provider: this.type,
      kind: 'unexpected_response',
      message: e?.message || 'Unexpected perplexity response',
    });
  }
}

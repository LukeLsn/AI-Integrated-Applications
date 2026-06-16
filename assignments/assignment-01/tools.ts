import { OpenAI } from 'openai';

export const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the contents of a file to provide context.',
      parameters: {
        type: 'object',
        properties: {
          file_path: { type: 'string' },
          start_line: { type: 'number' },
          end_line: { type: 'number' }
        },
        required: ['file_path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'ripgrep',
      description: 'Search for patterns in the codebase.',
      parameters: {
        type: 'object',
        properties: { search_pattern: { type: 'string' } },
        required: ['search_pattern']
      }
    }
  }
];
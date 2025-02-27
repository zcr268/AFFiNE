import fs from 'fs-extra';

interface WavWriterConfig {
  targetSampleRate?: number;
}

export class WavWriter {
  private readonly file: fs.WriteStream;
  private readonly originalSampleRate: number = 44100;
  private readonly targetSampleRate: number;
  private readonly numChannels = 1; // The audio is mono
  private samplesWritten = 0;
  private readonly tempFilePath: string;
  private readonly finalFilePath: string;

  constructor(finalPath: string, config: WavWriterConfig = {}) {
    this.finalFilePath = finalPath;
    this.tempFilePath = finalPath + '.tmp';
    this.targetSampleRate = config.targetSampleRate ?? this.originalSampleRate;
    this.file = fs.createWriteStream(this.tempFilePath);
    this.writeHeader(); // Always write header immediately
  }

  private writeHeader() {
    const buffer = Buffer.alloc(44); // WAV header is 44 bytes

    // RIFF chunk descriptor
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36, 4); // Initial file size - 8 (will be updated later)
    buffer.write('WAVE', 8);

    // fmt sub-chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    buffer.writeUInt16LE(3, 20); // AudioFormat (3 for IEEE float)
    buffer.writeUInt16LE(this.numChannels, 22); // NumChannels
    buffer.writeUInt32LE(this.targetSampleRate, 24); // SampleRate
    buffer.writeUInt32LE(this.targetSampleRate * this.numChannels * 4, 28); // ByteRate
    buffer.writeUInt16LE(this.numChannels * 4, 32); // BlockAlign
    buffer.writeUInt16LE(32, 34); // BitsPerSample (32 for float)

    // data sub-chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(0, 40); // Initial data size (will be updated later)

    this.file.write(buffer);
  }

  private resample(samples: Float32Array): Float32Array {
    const ratio = this.originalSampleRate / this.targetSampleRate;
    const newLength = Math.floor(samples.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const position = i * ratio;
      const index = Math.floor(position);
      const fraction = position - index;

      // Linear interpolation between adjacent samples
      if (index + 1 < samples.length) {
        result[i] =
          samples[index] * (1 - fraction) + samples[index + 1] * fraction;
      } else {
        result[i] = samples[index];
      }
    }

    return result;
  }

  write(samples: Float32Array) {
    // Resample the input samples
    const resampledData = this.resample(samples);

    // Create a buffer with the correct size (4 bytes per float)
    const buffer = Buffer.alloc(resampledData.length * 4);

    // Write each float value properly
    for (let i = 0; i < resampledData.length; i++) {
      buffer.writeFloatLE(resampledData[i], i * 4);
    }

    this.file.write(buffer);
    this.samplesWritten += resampledData.length;
  }

  async end(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.file.end(() => {
        void this.updateHeaderAndCleanup().then(resolve).catch(reject);
      });
    });
  }

  private async updateHeaderAndCleanup(): Promise<void> {
    // Read the entire temporary file
    const data = await fs.promises.readFile(this.tempFilePath);

    // Update the header with correct sizes
    const dataSize = this.samplesWritten * 4;
    const fileSize = dataSize + 36;

    data.writeUInt32LE(fileSize, 4); // Update RIFF chunk size
    data.writeUInt32LE(dataSize, 40); // Update data chunk size

    // Write the updated file
    await fs.promises.writeFile(this.finalFilePath, data);

    // Clean up temp file
    await fs.promises.unlink(this.tempFilePath);
  }
}

/**
 * Creates a Buffer from Float32Array audio data
 * @param float32Array - The Float32Array containing audio samples
 * @returns FileData - The audio data as a Buffer
 */
export function FileData(float32Array: Float32Array): Buffer {
  const buffer = Buffer.alloc(float32Array.length * 4); // 4 bytes per float
  for (let i = 0; i < float32Array.length; i++) {
    buffer.writeFloatLE(float32Array[i], i * 4);
  }
  return buffer;
}

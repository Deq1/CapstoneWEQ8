import { WEQ8Runtime } from "../runtime";

export class WEQ8Analyser {
  private analyser: AnalyserNode;
  private analysisData: Uint8Array;
  private analysisXs: number[];
  private disposed = false;

  private resizeObserver: ResizeObserver;

  constructor(private runtime: WEQ8Runtime, private canvas: HTMLCanvasElement) {
    this.analyser = runtime.audioCtx.createAnalyser();
    this.analyser.fftSize = 8192;
    this.analyser.smoothingTimeConstant = 0.5;
    runtime.connect(this.analyser);
    this.analysisData = new Uint8Array(this.analyser.frequencyBinCount);
    
   // let minLog = Math.log10(20);
   // let maxLog = Math.log10(runtime.audioCtx.sampleRate / 2) - 1;
   let minFreq = 20;
   let maxFreq = 20000;

    this.canvas.width = this.canvas.offsetWidth * window.devicePixelRatio;
    this.canvas.height = this.canvas.offsetHeight * window.devicePixelRatio;
    this.analysisXs = this.calculateAnalysisXs(minFreq,maxFreq);
    this.resizeObserver = new ResizeObserver(() => {
      this.canvas.width = this.canvas.offsetWidth * window.devicePixelRatio;
      this.canvas.height = this.canvas.offsetHeight * window.devicePixelRatio;
      this.analysisXs = this.calculateAnalysisXs(minFreq, maxFreq);
    });
    this.resizeObserver.observe(this.canvas);
  }

  // private calculateAnalysisXs(maxLog: number): number[] {  
  //   return Array.from(this.analysisData).map((_, i) => {
  //     let freq =
  //       (i / this.analysisData.length) * (this.runtime.audioCtx.sampleRate / 2);
  //     return Math.floor(((Math.log10(freq) - 1) / maxLog) * this.canvas.width);
  //   });
  // }


  private calculateAnalysisXs(minFreq: number, maxFreq: number): number[] {
    // Define the minimum and maximum log frequencies
    let minLogFreq = Math.log10(minFreq); // log10 of 20 Hz
    let maxLogFreq = Math.log10(maxFreq); // log10 of 20 kHz

    // Adjust the maxLog value to represent the log10 of 20kHz
    // maxLog = maxLogFreq - 1; 

    return Array.from(this.analysisData).map((_, i) => {
      // Convert bin index to frequency
      let freq = (i / this.analysisData.length) * (this.runtime.audioCtx.sampleRate / 2);

      // Check if frequency is within the desired range before mapping
      if (freq < minFreq) {
        return 0; // Position at the start of the canvas
      } else if (freq > maxFreq) {
        return this.canvas.width; // Position at the end of the canvas
      } else {
        // Scale frequency to fit within the 20Hz to 20kHz range
        let logFreq = Math.log10(freq);
        return Math.floor(((logFreq - minLogFreq) / (maxLogFreq - minLogFreq)) * this.canvas.width);
      }
    });
  }


  analyse() {
    let frame = () => {
      if (this.disposed) return;
      this.analyser.getByteFrequencyData(this.analysisData);
      this.draw();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  private draw() {
    let w = this.canvas.width,
      h = this.canvas.height,
      yScale = this.canvas.height / 255;

    let ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get a canvas context!");

    ctx.clearRect(0, 0, w, h);

    let path = new Path2D();
    path.moveTo(0, h);
    for (let i = 0; i < this.analysisData.length; i++) {
      let y = Math.floor(h - this.analysisData[i] * yScale);
      path.lineTo(this.analysisXs[i], y);
    }
    path.lineTo(w, h);

    ctx.fillStyle = "rgba(139, 0, 0, 0.5)";
    ctx.fill(path);

    ctx.strokeStyle = "rgba(179, 0, 0, 0.7)";
    ctx.stroke(path);
  }

  dispose() {
    this.disposed = true;
    this.analyser.disconnect();
    this.resizeObserver.disconnect();
  }
}

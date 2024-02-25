import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { WEQ8Runtime } from "../runtime";
import { FilterType } from "../spec";
import {
  clamp,
  filterHasFrequency,
  filterHasGain,
  filterHasQ,
  formatFrequency,
  formatFrequencyUnit,
  toLin,
  toLog10,
} from "../functions";
import { sharedStyles } from "./styles";


@customElement("weq8-ui-filter-knob")
export class EQUIFilterKnobElements extends LitElement {
    static styles = [sharedStyles,css`
    .knob {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: radial-gradient(circle at center, #f9f9f9 0%, #ddd 70%, #bbb 100%);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2), inset 0 5px 15px rgba(0, 0, 0, 0.3), inset 0 -5px 15px rgba(255, 255, 255, 0.3);
        position: relative;
        cursor: pointer;
    }
    
    .knob::before {
        content: '';
        position: absolute;
        top: 5px;
        left: 22.5px;
        width: 5px;
        height: 10px;
        background-color: #39ad90;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
    }

    .knobs-container {
     display: flex;
     justify-content: space-around;

    }`
      
      ,
    ];

   

  @property({ attribute: false })
  runtime?: WEQ8Runtime;

  @property()
  index?: number;

  @state()
  private isDragging = false;

  @state()
  private currentRotation = 0;

  @state()
  private startAngle = 0;


  private rotateHandler: ((event: MouseEvent) => void) | undefined;
  private stopRotateHandler: ((event: MouseEvent) => void) | undefined;

  constructor() {
    super();
    this.rotateHandler = this._rotate.bind(this);
    this.stopRotateHandler = this._stopRotate.bind(this);
  }

  render() {
        return html`
            <div class="knob"
                 @mousedown="${this._startRotate}"
                 style="transform: rotate(${this.currentRotation}deg);"></div>
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        // Adding event listeners to the whole document to capture mouse movements and release
        document.addEventListener('mousemove', this._rotate.bind(this));
        document.addEventListener('mouseup', this._stopRotate.bind(this));
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // Removing event listeners when the element is removed from the DOM
        document.removeEventListener('mousemove', this._rotate);
        document.removeEventListener('mouseup', this._stopRotate);
    }

    _getAngle(event: MouseEvent) {

      if(!this.shadowRoot) {
        return 0;
      }
        const knob = this.shadowRoot.querySelector('.knob');
       
      if(!knob) {
        return 0;
      }
        const rect = knob.getBoundingClientRect();
        const center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        const angle = Math.atan2(event.clientY - center.y, event.clientX - center.x);
        
        return angle * (180 / Math.PI); // Convert radians to degrees
    }

    _startRotate(event: MouseEvent) {
        this.isDragging = true;
        this.startAngle = this._getAngle(event) - this.currentRotation;
        event.preventDefault(); // Prevents text selection, etc.
    }

    _rotate(event: MouseEvent) {
        if (!this.isDragging) return;
        const angle = this._getAngle(event);
        this.currentRotation = angle - this.startAngle;
        this.requestUpdate(); // Request update for re-rendering
    }

    _stopRotate() {
        this.isDragging = false;
    }



    
  private setFilterType(type: FilterType | "noop") {
    if (!this.runtime || this.index === undefined) return;
    this.runtime.setFilterType(this.index, type);
  }

  private setFilterFrequency(frequency: number) {
    if (!this.runtime || this.index === undefined) return;
    if (!isNaN(frequency)) {
      this.runtime.setFilterFrequency(this.index, frequency);
    }
  }

  private setFilterGain(gain: number) {
    if (!this.runtime || this.index === undefined) return;
    if (!isNaN(gain)) {
      this.runtime.setFilterGain(this.index, gain);
    }
  }

  private setFilterQ(Q: number) {
    if (!this.runtime || this.index === undefined) return;
    if (!isNaN(Q)) {
      this.runtime.setFilterQ(this.index, Q);
    }
  }


 


  private calculateFrequencyFromRotation(rotation: number) {
    if (!this.runtime || this.index === undefined) return;
    const minFreq = 20; // Example: 20 Hz
  const maxFreq = this.runtime?.audioCtx.sampleRate/2; // Example: 20,000 Hz
  // Convert rotation (0-360 degrees) to a value between 0 and 1
  const normalizedRotation = rotation / 360;
  // Use a logarithmic scale for frequency mapping
  const frequencyLog = toLog10(normalizedRotation, minFreq, maxFreq);
  // Convert back to linear scale to get the frequency value
  const frequency = toLin(frequencyLog, minFreq, maxFreq);
  return frequency;

}

 private calculateGainFromRotation(rotation: number) {
  if (!this.runtime || this.index === undefined) return;
  const minGain = -15; // Minimum gain in dB
  const maxGain = 15; // Maximum gain in dB
  // Normalize rotation to a value between 0 and 1
  const normalizedRotation = rotation / 360;
  // Linearly map the normalized rotation to the gain range
  const gain = clamp(minGain + normalizedRotation * (maxGain - minGain), minGain, maxGain);
  return gain;
}

 private calculateQFromRotation(rotation: number) {
  if (!this.runtime || this.index === undefined) return;
  const minQ = 0.1; // Minimum Q
  const maxQ = 18; // Maximum Q
  // Normalize rotation to a value between 0 and 1
  const normalizedRotation = rotation / 360;
  // Use a logarithmic scale for Q mapping
  const qLog = toLog10(normalizedRotation, minQ, maxQ);
  // Convert back to linear scale to get the Q value
  const Q = toLin(qLog, minQ, maxQ);
  return  Q;
}


}
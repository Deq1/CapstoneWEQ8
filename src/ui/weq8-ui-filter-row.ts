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
import { TYPE_OPTIONS } from "./constants";


type DragState = {
  pointer: number;
  startY: number;
  startValue: number;
};

const frequencyRange = {min: 20, max: 24000};
const gainRange = {min: -15, max: 15};
const qRange = {min:0.1, max: 18};



@customElement("weq8-ui-filter-row")
export class EQUIFilterRowElement extends LitElement {
  static styles = [
    sharedStyles,
    css`  
      :host {
        display: grid;
        grid-auto-flow: column;
        grid-template-columns: 60px 50spx 60px 60px;
        align-items: center;
        gap: 5px;
        background-color: transparent;
        border-radius: 22px;
        transition: background-color 0.15s  ease;
      }
      :host(.selected) {
        background-color: #373737;
      }
      input,
      select {
        padding: 0;
        border: 0;
      }
      input {
        border-bottom: 1px solid transparent;
        transition: border-color 0.15s ease;
      }
      input:focus,
      input:active {
        border-color: white;
      }
      .chip {
        display: inline-grid;
        grid-auto-flow: column;
        gap: 3px;
        height: 20px;
        padding-right: 6px;
        border-radius: 10px;
        background: #373737;
        transition: background-color 0.15s ease;
      }
      :host(.selected) .chip .filterNumber {
        background: #ffcc00;
      }
      .chip.disabled:hover {
        background: #44ffff;
      }
      .filterNumber {
        cursor: pointer;
        width: 20px;
        height: 20px;
        border-radius: 10px;
        display: grid;
        place-content: center;
        background: white;
        font-weight: var(--font-weight);
        color: black;
        transition: background-color 0.15s ease;
      }
      .chip.disabled .filterNumber {
        background: transparent;
        color: white;
      }
      .chip.bypassed .filterNumber {
        background: #7d7d7d;
        color: black;
      }
      .filterTypeSelect {
        width: 30px;
        appearance: none;
        outline: none;
        background-color: transparent;
        color: white;
        cursor: pointer;
        text-align: center;
        font-family: var(--font-stack);
        font-size: var(--font-size);
        font-weight: var(--font-weight);
      }
      .filterTypeSelect.bypassed {
        color: #7d7d7d;
      }
      .chip.disabled .filterTypeSelect {
        pointer-events: all;
      }
      .frequencyInput {
        width: 28px;
      }
      .gainInput {
        width: 26px;
      }
      .qInput {
        width: 30px;
      }
      .numberInput {
        appearance: none;
        outline: none;
        background-color: transparent;
        color: white;
        text-align: right;
        -moz-appearance: textfield;
        font-family: var(--font-stack);
        font-size: var(--font-size);
        font-weight: var(--font-weight);
        touch-action: none;
      }
      .numberInput:disabled,
      .disabled {
        color: #7d7d7d;
        pointer-events: none;
      }
      .bypassed {
        color: #7d7d7d;
      }
      .numberInput::-webkit-inner-spin-button,
      .numberInput::-webkit-outer-spin-button {
        -webkit-appearance: none !important;
        margin: 0 !important;
      }




      .knob {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: radial-gradient(circle at center, #e0e0e0 0%, #b0b0b0 70%, #909090 100%);
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
        background-color: #757575; /* Adjusted to a shade of grey */
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
    }
    


    #slider-container {
      height: 200px; /* Adjust based on your preference */
      display: flex;
     flex-direction: column;
      justify-content: center;
      background-color: #1E1E1E; /* Even darker shade for the container */
      padding: 0.5px;
      border-radius: 5px; /* Rounded corners for the container */
      box-shadow: 0 8px 16px rgba(0,0,0,0.3); /* More pronounced shadow for depth */
    }
    
    .slider {
      -webkit-appearance: none;
      appearance: none;
      width: 100%; /* Full container width */
      height: 5px; /* Slider thickness */
      background: #333; /* Darker slider track */
      outline: none;
      opacity: 0.8; /* Slightly more opacity */
      -webkit-transition: .2s; /* Smooth transition for hover effects */
      transition: opacity .2s;
      transform: rotate(270deg); /* Rotates slider to vertical position */
      border-radius: 5px; /* Rounded corners for the slider */
    }
    
    .slider:hover {
      opacity: 1; /* Full opacity on hover */
    }
    
    .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 25px; /* Handle width */
      height: 25px; /* Handle height */
      background: #520a96; /* Handle color, can be adjusted for darker themes */
      cursor: pointer;
      border-radius: 50%; /* Rounded handle for a modern look */
      box-shadow: 0 2px 4px 0 rgba(0,0,0,0.4); /* Deeper shadow for the handle */
      border: none; /* Optional: remove border for a sleeker look */
    }
    
    .slider::-moz-range-thumb {
      width: 25px;
      height: 25px;
      background: #4CAF50;
      cursor: pointer;
      border-radius: 50%;
      box-shadow: 0 2px 4px 0 rgba(0,0,0,0.4);
      border: none;
    }
    
    .slider::-webkit-slider-runnable-track {
      box-shadow: inset 0 0 5px rgba(0,0,0,0.5); /* Inner shadow for added depth */
    }
    
    .slider::-moz-range-track {
      box-shadow: inset 0 0 5px rgba(0,0,0,0.5);
    }

   

    `,
  ];

  


  constructor() {
    super();
    this.addEventListener("click", () =>
      this.dispatchEvent(
        new CustomEvent("select", { composed: true, bubbles: true })
      )
    );
  }

  @property({ attribute: false })
  runtime?: WEQ8Runtime;

  @property()
  index?: number;

  @state()
  private frequencyInputFocused = false;

  @state()
  private dragStates: {
    frequency: DragState | null;
    gain: DragState | null;
    Q: DragState | null;
  } = { frequency: null, gain: null, Q: null };

  render() {
    if (!this.runtime || this.index === undefined) return;

    let typeOptions = TYPE_OPTIONS.filter((o) =>
      this.runtime!.supportedFilterTypes.includes(o[0] as FilterType)
    );

    let spec = this.runtime.spec[this.index];



    return html`
      <th>
        <div
          class=${classMap({
            chip: true,
            disabled: !filterHasFrequency(spec.type),
            bypassed: spec.bypass,
          })}
        >
        <div
        class=${classMap({
          filterNumber: true,
          bypassed: spec.bypass,
        })}
        @click=${() => this.toggleBypass()}
      >
        ${this.index + 1}
      </div>
      <select
      class=${classMap({ filterTypeSelect: true, bypassed: spec.bypass })}
      @change=${(evt: { target: HTMLSelectElement }) =>
        this.setFilterType(evt.target.value as FilterType | "noop")}
       >
            ${typeOptions.map(
              ([type, label]) =>
                html`<option value=${type} ?selected=${spec.type === type}>
                  ${label}
                </option>`
            )}
          </select>
        </div>
      </th>
      <td>
        <input
          class=${classMap({
            frequencyInput: true,
            numberInput: true,
            bypassed: spec.bypass,
          })}
          type="number"
          step="0.1"
          lang="en_EN"
          .value=${formatFrequency(spec.frequency, this.frequencyInputFocused)}
          ?disabled=${!filterHasFrequency(spec.type)}
          @focus=${() => (this.frequencyInputFocused = true)}
          @blur=${() => {
            this.frequencyInputFocused = false;
            this.setFilterFrequency(clamp(spec.frequency, 10, this.nyquist));
          }}
        
        />
        <span
          class=${classMap({
            frequencyUnit: true,
            disabled: !filterHasFrequency(spec.type),
            bypassed: spec.bypass,
          })}
          >${formatFrequencyUnit(
            spec.frequency,
            this.frequencyInputFocused
          )}</span
        >
        <div class="knob" 
        @input=${(evt: { target: HTMLInputElement }) =>
        this.setFilterFrequency(evt.target.valueAsNumber)}
        @pointerdown=${(evt: PointerEvent) =>
          this.startDraggingValue(evt, "frequency")}  
        @pointerup=${(evt: PointerEvent) =>
            this.stopDraggingValue(evt, "frequency")}
        @pointermove=${(evt: PointerEvent) =>
              this.dragValue(evt, "frequency")}
          style="transform: rotate(${this.frequencyToDegree(spec.frequency)}deg)">
          </div>
      </td>
      <td>
        <input
          class=${classMap({
            gainInput: true,
            numberInput: true,
            bypassed: spec.bypass,
          })}
          type="number"
          min="-15"
          max="15"
          step="0.1"
          lang="en_EN"
          .value=${spec.gain.toFixed(1)}
          ?disabled=${!filterHasGain(spec.type)}
        
        />
        <span
          class=${classMap({
            gainUnit: true,
            disabled: !filterHasGain(spec.type),
            bypassed: spec.bypass,
          })}
          >dB</span
        >
        <div class =  "knob"       
      @input=${(evt: { target: HTMLInputElement }) =>
        this.setFilterGain(evt.target.valueAsNumber)}
      @pointerdown=${(evt: PointerEvent) =>
        this.startDraggingValue(evt, "gain")}
      @pointerup=${(evt: PointerEvent) =>
        this.stopDraggingValue(evt, "gain")}
      @pointermove=${(evt: PointerEvent) => this.dragValue(evt, "gain")}  
        style = "transform: rotate(${this.gainToDegree(spec.gain)}deg)"></div>
         
        </div>
      </td>
      <td>
        <input
          class=${classMap({
            qInput: true,
            numberInput: true,
            bypassed: spec.bypass,
          })}
          type="number"
          min="0.1"
          max="18"
          step="0.1"
          .value=${spec.Q.toFixed(2)}
          ?disabled=${!filterHasQ(spec.type)}
         
        />
        <div class =  "knob"
        @input=${(evt: { target: HTMLInputElement }) =>
        this.setFilterQ(evt.target.valueAsNumber)}
       @pointerdown=${(evt: PointerEvent) =>
        this.startDraggingValue(evt, "Q")}
       @pointerup=${(evt: PointerEvent) => this.stopDraggingValue(evt, "Q")}
       @pointermove=${(evt: PointerEvent) => this.dragValue(evt, "Q")}
          style = "transform: rotate(${this.qToDegree(spec.Q)}deg)"></div>
        </div>
      </td>

        
      
    `;
  }

  
  
  private get nyquist() {
    return (this.runtime?.audioCtx.sampleRate ?? 48000) / 2;
  }

  private toggleBypass() {
    if (!this.runtime || this.index === undefined) return;
    this.runtime.toggleBypass(
      this.index,
      !this.runtime.spec[this.index].bypass
    );
  }

  private setFilterType(type: FilterType | "noop") {
    if (!this.runtime || this.index === undefined) return;
    this.runtime.setFilterType(this.index, type);
  }

  private setFilterFrequency(frequency: number) {
    if (!this.runtime || this.index === undefined) return;
    if (!isNaN(frequency)) {
      this.runtime.setFilterFrequency(this.index, frequency);
   //   this.frequencyToDegree(frequency);
    }
  }

  private setFilterGain(gain: number) {
    if (!this.runtime || this.index === undefined) return;
    if (!isNaN(gain)) {
      this.runtime.setFilterGain(this.index, gain);
   //   this.gainToDegree(gain);
    }
  }

  private setFilterQ(Q: number) {
    if (!this.runtime || this.index === undefined) return;
    if (!isNaN(Q)) {
      this.runtime.setFilterQ(this.index, Q);
    //  this.qToDegree(Q);
    }
  }

  private startDraggingValue(
    evt: PointerEvent,
    property: "frequency" | "gain" | "Q"
  ) {
    if (!this.runtime || this.index === undefined) return;

    (evt.target as Element).setPointerCapture(evt.pointerId);
    this.dragStates = {
      ...this.dragStates,
      [property]: {
        pointer: evt.pointerId,
        startY: evt.clientY,
        startValue: this.runtime.spec[this.index][property],
      },
    };
  }

  private stopDraggingValue(
    evt: PointerEvent,
    property: "frequency" | "gain" | "Q"
  ) {
    if (!this.runtime || this.index === undefined) return;

    if (this.dragStates[property]?.pointer === evt.pointerId) {
      (evt.target as Element).releasePointerCapture(evt.pointerId);
      this.dragStates = { ...this.dragStates, [property]: null };
    }
  }

  private dragValue(evt: PointerEvent, property: "frequency" | "gain" | "Q") {
    if (!this.runtime || this.index === undefined) return;
    let dragState = this.dragStates[property];
    if (dragState && dragState.pointer === evt.pointerId) {
      let startY = dragState.startY;
      let currentY = evt.clientY;
      let yDelta = -(currentY - startY);
      let relYDelta = clamp(yDelta / 150, -1, 1);
      if (property === "frequency") {
        let minFreq = 10;
        let maxFreq = this.runtime.audioCtx.sampleRate / 2;
        let startFreqLog = toLog10(dragState.startValue, minFreq, maxFreq);
        let newFreq = toLin(startFreqLog + relYDelta, minFreq, maxFreq);
        this.runtime.setFilterFrequency(this.index, newFreq);
      } else if (property === "gain") {
        let gainDelta = relYDelta * 15;
        this.runtime.setFilterGain(
          this.index,
          clamp(dragState.startValue + gainDelta, -15, 15)
        );
      } else if (property === "Q") {
        let minQ = 0.1;
        let maxQ = 18;
        let startQLog = toLog10(dragState.startValue, minQ, maxQ);
        let newQ = toLin(startQLog + relYDelta, minQ, maxQ);
        this.runtime.setFilterQ(this.index, newQ);
      }
      (evt.target as HTMLInputElement).blur();
    }
  }


    private valueToDegree(value: number, min: number, max: number, maxRotation: number = 270): number {
      const normalized = (value - min) / (max - min);
      return normalized * maxRotation; 
    }

    private frequencyToDegree(frequency: number): number {
      console.log("called");
      return this.valueToDegree(frequency, frequencyRange.min, frequencyRange.max) - 125;
      
    }

  private gainToDegree(gain: number): number {
      return this.valueToDegree(gain, gainRange.min, gainRange.max) -135 ;
    }

  private qToDegree(Q: number): number {

      return this.valueToDegree(Q, qRange.min, qRange.max) - 135 ;
    }



///////////////////////////////////////////////////////////////////







}
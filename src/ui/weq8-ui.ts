import { LitElement, html, css, svg, ReactiveElement } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { WEQ8Runtime } from "../runtime";
import { WEQ8Filter } from "../spec";
import { WEQ8Analyser } from "./WEQ8Analyser";
import { WEQ8RawAudio } from "./WEQ8RawAudio";
import { WEQ8FrequencyResponse } from "./WEQ8FrequencyResponse";
import { sharedStyles } from "./styles";
import { clamp, filterHasGain, toLin, toLog10 } from "../functions";

import "./weq8-ui-filter-row";
// import "./weq8-ui-filter-hud";





@customElement("weq8-ui")
export class WEQ8UIElement extends LitElement {
  static styles = [sharedStyles, css`:host {
    display: grid;
    grid-auto-flow: column;
    grid-template-columns: 60px 60spx 60px 60px;
  
    height: 100%;
    align-items: stretch;
    gap: 10px;
    min-width: 400px;
    min-height: 600px;
    padding: 20px;
    border-radius: 8px;
    overflow: visible;
    background: #1A1A1A;
    border: 10px solid #8B4513;
     
  }

  :host(.collapsed){
    min-height:10px;
    max-width:20px;
   // padding: 10px;//
    justify-content: center;
    align-items: center;

  }


  .filters {
    display: inline-grid;
    grid-auto-flow: row;
    gap: 20px;
  }

  .filters tbody
  {
    display: contents;
   
 
  }

  .filters tr {
    display: contents;
    
  }

  .filters thead {
   
    display: grid;
    grid-auto-flow: column;
    grid-template-columns:  100px 100px 100px 100px ;
    align-items: center;
    gap: 60px;
    transform:translateX(60px);
  }



  .filters thead th {
    display: grid;
    place-content: center;
    height: 20px;
    border-radius: 20px;
    font-weight: var(--font-weight);
    border: 5px solid #373737;
    position: relative;
  }
  
  .filters thead th.headerFilter { 
    position : relative;
    left: 10px;
  }
  .filters thead th.headerFreq {
    position : relative;
    left: 10px;
  }
  .filters thead th.headerGain {
    position: relative;
    left: 20px;

  }
  .filters thead th.headerQ {
    position: relative;
    left: 30px;
  
  }



 

  .visualisation {
    flex: 1;
    position: relative;
    border: 1px solid #373737;
    min-height:400px;
    
     
   
  }
  canvas,
  svg {
    position: absolute;
    top: 1;
    left: 0;
    width: 100%;
    height: 100%;
  }
  svg {
    overflow: visible;
  }
  .grid-x,
  .grid-y {
    stroke: #333;
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
  }
  .filter-handle-positioner {
    position: absolute;
    top: 0px;
    left: 0;
    width: 50px;
    height: 100px;
    touch-action: none;
  }
  .filter-handle {
    position: absolute;
    top: 0;
    left: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: #fff;
    color: black;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: center;
    align-items: center;
    user-select: none;
    cursor: grab;
    transition: background-color 0.15s ease;
  }
  .filter-handle.selected {
    background: #ffffff;
  }
  .filter-handle.bypassed {
    background: #696969;
  }
  


  button {
    background-color: #696969; 
    color: white; 
    padding: 4.5px 8px;
    border: ;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.3s ease;

  }


  .slider-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
}

.slider {
    -webkit-appearance: none;
    width: 100%;
    height: 5px;
    border-radius: 5px;
    background: #d3d3d3;
    outline: none;
    opacity: 0.7;
    -webkit-transition: .2s;
    transition: opacity .2s;
}

.slider:hover {
    opacity: 1;
}

.slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    background: #4CAF50;
    cursor: pointer;
}

.slider::-moz-range-thumb {
    width: 25px;
    height: 25px;
    border-radius: 50%;
    background: #4CAF50;
    cursor: pointer;
}
 

  
  ` ,
  ];


  constructor() {
    super();
    this.addEventListener("click", (evt) => {
      if (evt.composedPath()[0] === this) this.selectedFilterIdx = -1;
    });
  }

  @property({ attribute: false })
  runtime?: WEQ8Runtime;

  @property()
  view: "hud" | "allBands" = "allBands";

  @state()
  private analyser?: WEQ8Analyser;


  @state()
  private RawAnalyser?: WEQ8RawAudio;


  // switch to show Raw Audio Data or not //
 @property()
 showRawAudio = true;



  toggleRawAudio() {
    this.showRawAudio = !this.showRawAudio;
    this.requestUpdate();
  }


  toggleUiVisible() {
    this.isUiVisible = !this.isUiVisible;
    this.requestUpdate(); 
  }




  @state()
  private frequencyResponse?: WEQ8FrequencyResponse;

  @state()
  private gridXs: number[] = [];


  @state()
  private isUiVisible = true;


  @state()
  private isPresetListVisible = false;

  @state()
  private dragStates: { [filterIdx: number]: number | null } = {};

  @state()
  private selectedFilterIdx = -1;

  @query(".analyser")
  private analyserCanvas?: HTMLCanvasElement;

  @query(".RawAnalyser")
  private RawAnalyserCanvas?: HTMLCanvasElement;

  @query(".frequencyResponse")
  private frequencyResponseCanvas?: HTMLCanvasElement;


 

   
 /* Save and load preset in UI part */

  private savePreset() {
    const presetName = prompt("Enter name for the preset:") ; 
    if (presetName && this.runtime) {
        this.runtime.saveSpec(presetName);
        alert(`Preset '${presetName}' saved.`);
    }
  }


  private loadPresetList() {

    const container = this.shadowRoot?.getElementById('presetListContainer');

    if (this.isPresetListVisible) {
        // If the list is already visible, hide it
        if (container) {
            container.innerHTML = '';  // Clear the dropdown content
        }
        this.hidePresetList();
    } else {
        // If the list is not visible, create and show it
        const presetNames = this.runtime?.getPresetNames();
        if (!presetNames || presetNames.length === 0) {
            alert("No presets available.");
            return;
        }

        // Create a select element
        const dropdown = document.createElement('select');
        dropdown.innerHTML = `<option disabled selected>Select a Preset</option>`;

        // Append options for each preset
        presetNames.forEach(presetName => {
            const option = document.createElement('option');
            option.value = presetName;
            option.textContent = presetName;
            dropdown.appendChild(option);
        });

        // Handle preset selection
        dropdown.addEventListener('change', () => {
            if (this.runtime && dropdown.value) {
                this.runtime.loadSpec(dropdown.value);

                // deleteSpec test
                // this.runtime?.deleteSpec(dropdown.value); 

                this.hidePresetList();  // Hide the list after selection
            }
        });

        // Append the dropdown to the container
        if (container) {
            container.appendChild(dropdown);
        }

        this.isPresetListVisible = true;      
        console.log("PresetVisible is set to true"); 
    }
}


private deletePresetList() {

  const container = this.shadowRoot?.getElementById('presetListContainer');

  if (this.isPresetListVisible) {
      // If the list is already visible, hide it
      if (container) {
          container.innerHTML = '';  // Clear the dropdown content
      }
      this.hidePresetList();
  } else {
      // If the list is not visible, create and show it
      const presetNames = this.runtime?.getPresetNames();
      if (!presetNames || presetNames.length === 0) {
          alert("No presets available.");
          return;
      }

      // Create a select element
      const dropdown = document.createElement('select');
      dropdown.innerHTML = `<option disabled selected>Select a Preset</option>`;

      

      // Append options for each preset
      presetNames.forEach(presetName => {
          const option = document.createElement('option');
          option.value = presetName;
          option.textContent = presetName;
          dropdown.appendChild(option);
      });


      // Handle preset selection
      dropdown.addEventListener('change', () => {
          if (this.runtime && dropdown.value) {

             
              // deleteSpec test
              this.runtime?.deleteSpec(dropdown.value); 
              this.hidePresetList();  // Hide the list after selection
          }
      });

      // Append the dropdown to the container
      if (container) {
          container.appendChild(dropdown);
      }

      this.isPresetListVisible = true;      
      console.log("PresetVisible is set to true"); 
  }

  
}


private hidePresetList(){
    const container = this.shadowRoot?.getElementById('presetListContainer');
    if (container) {
        container.innerHTML = ''; // Clear the dropdown content
    }

    this.isPresetListVisible = false;

    console.log("PresetVisible is set to false");
}




// connectedCallback() {
//   super.connectedCallback();
//     this.runtime?.on('filtersChanged', () => {
//       this.requestUpdate()
//     });
// }


resetEQ(){
  this.runtime?.resetFilters();
}

 


  RefreshAnalysers(){
    this.DrawAnalysers();
    this.requestUpdate();
  }


  DrawAnalysers()
  {
      if (this.runtime && this.analyserCanvas && this.frequencyResponseCanvas) {

   
        this.analyser = new WEQ8Analyser(this.runtime, this.analyserCanvas);
        this.analyser.analyse();
   
        if (this.showRawAudio && this.RawAnalyserCanvas) {
          this.RawAnalyser = new WEQ8RawAudio(this.runtime, this.RawAnalyserCanvas);
          this.RawAnalyser.analyse();
          
        }
        else {
          this.RawAnalyser?.dispose();
          this.RawAnalyser = undefined;
        
        }
  
        this.frequencyResponse = new WEQ8FrequencyResponse( this.runtime,this.frequencyResponseCanvas);
        this.frequencyResponse.render();

        let newGridXs: number[] = [];
        let nyquist = this.runtime.audioCtx.sampleRate / 2;
        let xLevelsOfScale = Math.floor(Math.log10(nyquist));
        for (let los = 0; los < xLevelsOfScale; los++) {
          let step = Math.pow(10, los + 1);
          for (let i = 1; i < 10; i++) {
            let freq = step * i;
            if (freq > nyquist) break;
            newGridXs.push(
              ((Math.log10(freq) - 1) / (Math.log10(nyquist) - 1)) * 100
            );
          }
        }
        this.gridXs = newGridXs;

       
        this.runtime.on("filtersChanged", () => {
          this.frequencyResponse?.render();
          this.requestUpdate();
          for (let row of Array.from(
            this.shadowRoot?.querySelectorAll("weq8-ui-filter-row") ?? []
          )) {
            (row as ReactiveElement).requestUpdate();
          }
        });
      } 
  } 




  updated(changedProperties: Map<string, unknown>) {   
    if (changedProperties.has("runtime") || changedProperties.has("showRawAudio")){

      this.analyser?.dispose();
      this.RawAnalyser?.dispose();
      this.frequencyResponse?.dispose();

      this.DrawAnalysers();
    }
  
    if (changedProperties.has("view")) {
      this.requestUpdate(); // Request another update to set handle positions in new view flow
    }

    if (changedProperties.has('isUiVisible')) {
      if(this.isUiVisible)
        {
        this.RefreshAnalysers();  
        }
      this.classList.toggle('collapsed',!this.isUiVisible);
    } 

  }
  


  render() {
    return html`
        <div>
            <button @click=${this.toggleUiVisible} class="hide-eq-btn">
                ${this.isUiVisible ? 'Hide the EQ' : 'Show the EQ'}
            </button>

            ${this.isUiVisible ? html`
                <div>
                    <button @click=${this.toggleRawAudio}>
                        ${this.showRawAudio ? 'Output Signal' : 'Input Signal'}
                    </button>
                    <div class="preset-controls">
                        <button @click=${this.resetEQ}>Reset EQ</button>
                        <button @click=${this.savePreset}>Save Preset</button>
                        <button @click=${this.loadPresetList}>Load Preset</button>
                        <button @click=${this.deletePresetList}>Delete Preset</button>

                        <button @click=${this.toggleCompressor}>
                            ${this.CompressorState() ? 'Disconnect Compressor' : 'Connect Compressor'}
                        </button>

                        <div id="presetListContainer"></div>
                    </div>
                
              
                </div>
                <div class="visualisation">
                    <svg viewBox="0 0 100 10" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                        ${this.gridXs.map(this.renderGridX)}
                        ${[12, 6, 0, -6, -12].map(this.renderGridY)}
                    </svg>
                    ${this.showRawAudio ? html`<canvas class="RawAnalyser"></canvas>` : ''}
                    <canvas class="analyser"></canvas>
                    <canvas class="frequencyResponse" @click=${() => (this.selectedFilterIdx = -1)}></canvas>
                    ${this.runtime?.spec.map((s, i) => s.type === "noop" ? undefined : this.renderFilterHandle(s, i))}
                    ${this.view === "hud" && this.selectedFilterIdx !== -1 ? this.renderFilterHUD() : null}
                </div>
                ${this.view === "allBands" ? this.renderTable() : null}
            ` : ''}
             
         <div class = "slider-container" >
                 <input type="range" min="0" max="100" value="50" class="slider" @input=${this.handleSliderInput}>
                 <span id = "sliderValue">50</span>    
            </div>


        </div>

    `;
}




  private renderTable() {
    return html` <table  class="filters">
      <thead>
          <tr>
            <th class ="headerFilter">Filter</th>
            <th class = "headerFreq">Freq</th>
            <th class = "headerGain">Gain</th>
            <th class = "headerQ">Q</th>
         </tr>
      </thead>
      <tbody>
      ${Array.from({ length: 8 }).map(
        (_, i) => 
          html`<weq8-ui-filter-row
            class="${classMap({ selected: this.selectedFilterIdx === i })}"
            .runtime=${this.runtime}
            .index=${i}
            @select=${(evt: CustomEvent) => {
              this.selectedFilterIdx =
                this.runtime?.spec[i].type === "noop" ? -1 : i;
              evt.stopPropagation();
            }}
          />`
          
      )}
      </tbody>
    </table>`;
  }







  

  // private renderTable() {
  //   return html` <table  class="filters">
  //     <thead>
  //         <tr>
  //           <th class ="headerFilter">Filter</th>
  //           <th class = "headerFreq">Freq</th>
  //           <th class = "headerGain">Gain</th>
  //           <th class = "headerQ">Q</th>
  //        </tr>
  //     </thead>
  //     <tbody>
     
  //   </tbody>
  //   </table>`;
  // }


  private renderFilterHUD() {
    if (!this.runtime) return html``;
    let spec = this.runtime?.spec[this.selectedFilterIdx];
    let [x, y] = this.getFilterPositionInVisualisation(spec);
    return html`<weq8-ui-filter-hud
      .runtime=${this.runtime}
      .index=${this.selectedFilterIdx}
      .x=${x}
      .y=${y}
    />`;
  }

/*   Handles Grids */ 


  private renderGridX(x: number) {
    return svg`<line
      class="grid-x"
      x1=${x}
      y1="0"
      x2=${x}
      y2="10"
    />`;
  }

  private renderGridY(db: number) {
    let relY = (db + 15) / 30;
    let y = relY * 10;
    return svg`<line
      class="grid-y"
      x1="0"
      y1=${y}
      x2="100"
      y2=${y}
    />`;
  }




   
  private renderFilterHandle(spec: WEQ8Filter, idx: number) {
    if (!this.runtime) return;
    let [x, y] = this.getFilterPositionInVisualisation(spec);
    return html`<div
      class="filter-handle-positioner"
      style="transform: translate(${x}px,${y}px)"
      @pointerdown=${(evt: PointerEvent) =>
        this.startDraggingFilterHandle(evt, idx)}
      @pointerup=${(evt: PointerEvent) =>
        this.stopDraggingFilterHandle(evt, idx)}
      @pointermove=${(evt: PointerEvent) => this.dragFilterHandle(evt, idx)}
    >
      <div
        class="${classMap({
          "filter-handle": true,
          bypassed: spec.bypass,
          selected: idx === this.selectedFilterIdx,
        })}"
      >
        ${idx + 1}
      </div>
    </div>`;
  }
    




 
  // private renderFilterHandle(spec: WEQ8Filter, idx: number) {
  //  if (!this.runtime) return;
  // //  let [x, y] = this.getFilterPositionInVisualisation(spec);
  // //   return null;

  // }





  private getFilterPositionInVisualisation(spec: WEQ8Filter): [number, number] {
    if (!this.runtime) return [0, 0];
    let width = this.analyserCanvas?.offsetWidth ?? 0;
    let height = this.analyserCanvas?.offsetHeight ?? 0;
    let x =
      toLog10(spec.frequency, 10, this.runtime.audioCtx.sampleRate / 2) * width;
    let y = height - ((spec.gain + 15) / 30) * height;
    if (!filterHasGain(spec.type)) {
      y = height - toLog10(spec.Q, 0.1, 18) * height;
    }
    return [x, y];
  }

  private startDraggingFilterHandle(evt: PointerEvent, idx: number) {
    (evt.target as Element).setPointerCapture(evt.pointerId);
    this.dragStates = { ...this.dragStates, [idx]: evt.pointerId };
    this.selectedFilterIdx = idx;
    evt.preventDefault();
  }

  private stopDraggingFilterHandle(evt: PointerEvent, idx: number) {
    if (this.dragStates[idx] === evt.pointerId) {
      (evt.target as Element).releasePointerCapture(evt.pointerId);
      this.dragStates = { ...this.dragStates, [idx]: null };
    }
  }

  private dragFilterHandle(evt: PointerEvent, idx: number) {
    if (this.runtime && this.dragStates[idx] === evt.pointerId) {
      let filterType = this.runtime.spec[idx].type;
      let canvasBounds =
        this.frequencyResponseCanvas?.getBoundingClientRect() ?? {
          left: 0,
          top: 0,
          width: 0,
          height: 0,
        };
      let pointerX = evt.clientX - canvasBounds.left;
      let pointerY = evt.clientY - canvasBounds.top;
      let pointerFreq = toLin(
        pointerX / canvasBounds.width,
        10,
        this.runtime.audioCtx.sampleRate / 2
      );
      this.runtime.setFilterFrequency(idx, pointerFreq);

      let relY = 1 - pointerY / canvasBounds.height;
      if (!filterHasGain(filterType)) {
        let pointerQ = toLin(relY, 0.1, 18);
        this.runtime.setFilterQ(idx, pointerQ);
      } else {
        let pointerGain = clamp(relY * 30 - 15, -15, 15);
        this.runtime.setFilterGain(idx, pointerGain);
      }
    }
  }


handleSliderInput(event:Event) {

  let target = event.target as HTMLInputElement;
  let newValue = Number(target.value);
  this.runtime?.setVolume(newValue/100);

  const mapValueToDisplay = (value: number , in_min: number , in_max: number , out_min: number , out_max: number ) =>
  ((value - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;

const displayValue = mapValueToDisplay(newValue, 0, 100, 0 ,100);

  const sliderValueDisplay = this.shadowRoot?.querySelector('#sliderValue');
  if (sliderValueDisplay) {
    sliderValueDisplay.textContent = displayValue.toFixed();
  } else {
    console.warn('Slider value display element not found.');
  }
 
}


toggleCompressor(){
    this.runtime?.toggleCompressorConnection();
    this.requestUpdate();
    console.log(this.CompressorState());

}


CompressorState() {
  return this.runtime?.getCompressorState();

}




  
}

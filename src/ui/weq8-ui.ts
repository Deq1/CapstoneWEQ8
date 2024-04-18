import { LitElement, html, css, svg, ReactiveElement } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { WEQ8Runtime } from "../runtime";
import { WEQ8Filter } from "../spec";
import { WEQ8Analyser } from "./WEQ8Analyser";
import { WEQ8RawAudio } from "./WEQ8RawAudio";
import { WEQ8FrequencyResponse } from "./WEQ8FrequencyResponse";
import { sharedStyles } from "./styles";
//import { clamp, filterHasGain, toLin, toLog10 } from "../functions";
import { filterHasGain, toLog10 } from "../functions";

import "./weq8-ui-filter-row";
// import "./weq8-ui-filter-hud";





@customElement("weq8-ui")
export class WEQ8UIElement extends LitElement {
  static styles = [sharedStyles, css`:host {

    position: absolute;
    cursor: move;
    z-index : 10;
    border: 10px solid #577265;

    
 
    display: grid;
    grid-auto-flow: column;
  
    height: 1100px;
    width: 800px ;
    align-items: stretch;
    gap: 10px;
    
    padding: 20px;
    border-radius: 8px;
    overflow: visible;
    background: #1A1A1A;
    border: 10px solid #577265;
     
  }

  :host(.collapsed){
  

  height: 10%;
  width : 10%;
 
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
    height: 40px;
    border-radius: 30px;
    font-size: 18px ;
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
    top: 1px;
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
      
  .button-container {
      display: flex; 
      flex-wrap: wrap; 
      gap: 10px; 
      justify-content: center; 
      align-items: center;
      padding: 20px; 
      background-color: #2c2c2c; 
      border-radius: 10px; 
      box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
      margin: 20px 0; 
  }
  button {
    background-color: #696969;
    color: white; 
    padding: 10px 20px; 
    border: none; 
    border-radius: 5px; 
    cursor: pointer; 
    transition: background-color 0.3s, transform 0.2s; 
    font-size: 15px;
    font-weight: 600; 
    outline: none; 
  }
  
  button:hover {
    background-color: #3498db; 
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
  
  button:active {
    background-color: #f1c40f; 
    transform: translateY(0); 
    box-shadow: 0 2px 4px rgba(0,0,0,0.2); 
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
    width: 35px;
    height: 25px;
    border-radius: 0;
    background: #8B0000;
    cursor: pointer;
}

.slider::-moz-range-thumb {
    width: 40px;
    height: 20px;
    border-radius: 0;
    background:  #d178a1;
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



  toggleCompressor() {
    if (this.runtime) {
      this.runtime.toggleCompressorConnection();
      console.log("State Changed");
      this.requestUpdate(); // Optionally request an update to reflect any UI changes.
    
    }
  }


  getCompressorState() {
  return this.runtime?.isCompressorConnected;
  }



  @state()
  private frequencyResponse?: WEQ8FrequencyResponse;

  @state()
  private gridXs: number[] = [];


  @state()
  private isUiVisible = true;

  @state()
  private isPresetListVisible = false;

  // @state()
  // private dragStates: { [filterIdx: number]: number | null } = {};

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
  } else if(this.runtime) {
      // If the list is not visible, create and show it
     // let presetNames: ing[] | undefined;

      let presetNames = this.runtime.getPresetNames();

      if (presetNames.length === 0) {
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

        

      //   let newGridXs: number[] = [];
      //   let nyquist = this.runtime.audioCtx.sampleRate / 2;
      //  // let nyquist = 20000;
      //   let xLevelsOfScale = Math.floor(Math.log10(nyquist));
      //   for (let los = 0; los < xLevelsOfScale; los++) {
      //     let step = Math.pow(10, los + 1);
      //     for (let i = 1; i < 10; i++) {
      //       let freq = step * i;
      //       if (freq > nyquist) break;
      //       newGridXs.push(
      //         ((Math.log10(freq) - 1) / (Math.log10(nyquist) - 1)) * 100
      //       );
      //     }
      //   }
      //   this.gridXs = newGridXs;

 

      const minFreq = 20; // 20 Hz
      const maxFreq = 20000; // 20,000 Hz
  
      let newGridXs: number[] = [];
      let xLevelsOfScale = Math.floor(Math.log10(maxFreq));
      for (let los = 0; los <= xLevelsOfScale; los++) {
        let step = Math.pow(10, los);
        for (let i = 1; i < 10; i++) {
          let freq = step * i;
          if (freq < minFreq) continue; // Skip frequencies below the minimum
          if (freq > maxFreq) break; // Stop adding frequencies above the maximum
          newGridXs.push(
            ((Math.log10(freq) - Math.log10(minFreq)) / (Math.log10(maxFreq) - Math.log10(minFreq))) * 100
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
                ${this.isUiVisible ? 'Hide EQ' : 'Show EQ'}
            </button>
            
            
            ${this.isUiVisible ? html`
                <div>
                    <div class = "button-container">
                     <button @click=${this.toggleRawAudio}>
                        ${this.showRawAudio ? 'Hide Analyzer' : 'Show Analyzer'}
                     </button>
                    
                    
                  
                        
                        <button @click=${this.resetEQ}>Reset EQ</button>
                        <button @click=${this.savePreset}>Save Preset</button>
                        <button @click=${this.deletePresetList}>Delete Preset</button>
                        <button @click=${this.loadPresetList}>Load Preset</button>

                  
                        
                        <div id="presetListContainer"></div>
                  
                </div>
    
                
                <div class="visualisation">
                    <svg viewBox="0 0 100 10" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                        ${this.gridXs.map(this.renderGridX)}
                        ${[10, 5, 0, -5, -10].map(this.renderGridY)}
                    </svg>
                    ${this.showRawAudio ? html`<canvas class="RawAnalyser"></canvas>` : ''}
                    <canvas class="analyser"></canvas>
                    <canvas class="frequencyResponse" @click=${() => (this.selectedFilterIdx = -1)}></canvas>
                    ${this.runtime?.spec.map((s) => s.type === "noop" ? undefined : this.renderFilterHandle())}
                    ${this.view === "hud" && this.selectedFilterIdx !== -1 ? this.renderFilterHUD() : null}
                </div>
                ${this.view === "allBands" ? this.renderTable() : null}
            ` : ''}
             <div class = "slider-container" >
             <label for="volumeSlider">Volume</label>
                <input type="range" min="0" max="200" value="100" class="slider" @input=${this.handleSliderInput}>
                <span id = "Volume">50</span>    
           </div>


         
        </div>

    `;
}



 //  <div class = "slider-container" >
          //  <label for="thresholdSlider">Threshold</label>
          //       <input type="range" min="-10" max="10" value="0" class="slider" @input=${this.SetThresholdValue}>
          //       <span id = "Threshold">0</span>    
          //  </div>


          //  <div class = "slider-container" >
          //  <label for="attackSlider">Attack</label>
          //      <input type="range" min="0" max="30" value="0" class="slider" @input=${this.SetAttackValue}>
          //      <span id = "Attack">0</span>    
          //  </div>

          //  <div class = "slider-container" >
          //  <label for="ratioSlider">Ratio</label>
          //     <input type="range" min="0" max="15" value="0" class="slider" @input=${this.SetRatioValue}>
          //     <span id = "Ratio">0</span>    
          // </div>
        




private renderTable() {
  // Array of filter labels
  const filterLabels = ["HF", "HMF", "LMF", "LF"];

  return html`<table class="filters">
    <thead>
        <tr>
          <th class="headerFilter">Filter Types</th>
          <th class="headerFreq">Frequency</th>
          <th class="headerGain">Gain</th>
          <th class="headerQ">Q</th>
        </tr>
    </thead>
    <tbody>
    ${filterLabels.map((label, i) => 
      html`<weq8-ui-filter-row
          class="${classMap({ selected: this.selectedFilterIdx === i })}"
          .runtime=${this.runtime}
          .index=${i}  // Pass the actual index
          .label=${label}  // Pass the label like "HF", "HMF", etc.
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


  private renderGridX(x: number) {
   // let xPosition = this.frequencyToCanvasPosition()
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




  
  // private renderFilterHandle(spec: WEQ8Filter, idx: number) {
  //   if (!this.runtime) return;
  //   let [x, y] = this.getFilterPositionInVisualisation(spec);
  //   return html`<div
  //     class="filter-handle-positioner"
  //     style="transform: translate(${x}px,${y}px)"
  //     @pointerdown=${(evt: PointerEvent) =>
  //       this.startDraggingFilterHandle(evt, idx)}
  //     @pointerup=${(evt: PointerEvent) =>
  //       this.stopDraggingFilterHandle(evt, idx)}
  //     @pointermove=${(evt: PointerEvent) => this.dragFilterHandle(evt, idx)}
  //   >
  //     <div
  //       class="${classMap({
  //         "filter-handle": true,
  //         bypassed: spec.bypass,
  //         selected: idx === this.selectedFilterIdx,
  //       })}"
  //     >
  //       ${idx + 1}
  //     </div>
  //   </div>`;
  // }
    




 
  private renderFilterHandle() {
   if (!this.runtime) return;
  //  let [x, y] = this.getFilterPositionInVisualisation(spec);
  //   return null;

  }





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

  // private startDraggingFilterHandle(evt: PointerEvent, idx: number) {
  //   (evt.target as Element).setPointerCapture(evt.pointerId);
  //   this.dragStates = { ...this.dragStates, [idx]: evt.pointerId };
  //   this.selectedFilterIdx = idx;
  //   evt.preventDefault();
  // }


  // private frequencyToCanvasPosition(frequency: number, canvasWidth:number): number {
    
  //   const minFreq = 20;
  //   const maxFreq = 20000;
         
  //   const minLog = Math.log10(minFreq);
  //   const maxLog = Math.log10(maxFreq);
  //   const logFreq = Math.log10(frequency);

  //   const proportion = (logFreq - minLog) / (maxLog - minLog);
  //   return proportion * canvasWidth;
  // }

  // private stopDraggingFilterHandle(evt: PointerEvent, idx: number) {
  //   if (this.dragStates[idx] === evt.pointerId) {
  //     (evt.target as Element).releasePointerCapture(evt.pointerId);
  //     this.dragStates = { ...this.dragStates, [idx]: null };
  //   }
  // }

  // private dragFilterHandle(evt: PointerEvent, idx: number) {
  //   if (this.runtime && this.dragStates[idx] === evt.pointerId) {
  //     let filterType = this.runtime.spec[idx].type;
  //     let canvasBounds =
  //       this.frequencyResponseCanvas?.getBoundingClientRect() ?? {
  //         left: 0,
  //         top: 0,
  //         width: 0,
  //         height: 0,
  //       };
  //     let pointerX = evt.clientX - canvasBounds.left;
  //     let pointerY = evt.clientY - canvasBounds.top;
  //     let pointerFreq = toLin(
  //       pointerX / canvasBounds.width,
  //       10,
  //       this.runtime.audioCtx.sampleRate / 2
  //     );
  //     this.runtime.setFilterFrequency(idx, pointerFreq);

  //     let relY = 1 - pointerY / canvasBounds.height;
  //     if (!filterHasGain(filterType)) {
  //       let pointerQ = toLin(relY, 0.1, 18);
  //       this.runtime.setFilterQ(idx, pointerQ);
  //     } else {
  //       let pointerGain = clamp(relY * 30 - 15, -15, 15);
  //       this.runtime.setFilterGain(idx, pointerGain);
  //     }
  //   }
  // }


handleSliderInput(event:Event) {

  let target = event.target as HTMLInputElement;
  let newValue = Number(target.value);
  this.runtime?.setVolume(newValue/100);



  if(newValue == 0){
    this.runtime?.VolumeNodeDisconnect();

  } else {
    this.runtime?.VolumeNodeConnect();
  }


  const mapValueToDisplay = (value: number , in_min: number , in_max: number , out_min: number , out_max: number ) =>
  ((value - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;

const displayValue = mapValueToDisplay(newValue, 0, 200, 0 ,100);

  const sliderValueDisplay = this.shadowRoot?.querySelector('#Volume');
  if (sliderValueDisplay) {
    sliderValueDisplay.textContent = displayValue.toFixed(0);
  } else {
    console.warn('Slider value display element not found.');
  }
 

}
  

SetThresholdValue(event:Event) {
  let target = event.target as HTMLInputElement;
  let newValue = Number(target.value);

 this.runtime?.setCompressorThreshold(newValue);


 const sliderValueDisplay = this.shadowRoot?.querySelector('#Threshold');
  if (sliderValueDisplay) {
    sliderValueDisplay.textContent = newValue.toFixed(0);
  } else {
    console.warn('Slider value display element not found.');
  }

}

SetAttackValue(event:Event) {

  let target = event.target as HTMLInputElement;
  let newValue = Number(target.value);

 this.runtime?.setCompressorAttack(newValue);


 const sliderValueDisplay = this.shadowRoot?.querySelector('#Attack');
  if (sliderValueDisplay) {
    sliderValueDisplay.textContent = newValue.toFixed(0);
  } else {
    console.warn('Slider value display element not found.');
  }

}





SetRatioValue(event: Event) {
  let target = event.target as HTMLInputElement;
  let newValue = Number(target.value);

 this.runtime?.setCompressorRatio(newValue);


 const sliderValueDisplay = this.shadowRoot?.querySelector('#Ratio');
  if (sliderValueDisplay) {
    sliderValueDisplay.textContent = newValue.toFixed(0);
  } else {
    console.warn('Slider value display element not found.');
  }

}


}
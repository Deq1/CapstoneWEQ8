import { createNanoEvents, Emitter, Unsubscribe } from "nanoevents";
import { WEQ8Spec, FilterType, DEFAULT_SPEC, FILTER_TYPES } from "./spec";
import { getBiquadFilterOrder, getBiquadFilterType } from "./functions";

interface WEQ8Events {
  filtersChanged: (spec: WEQ8Spec) => void;

  volumeChanged: (level: number ) => void;

  CompressorChanged: (value: number) => void;
  
}
export class WEQ8Runtime {
  public readonly input: AudioNode;
  private readonly output: AudioNode;
  private  volumeNode: GainNode;
  private Compressor: DynamicsCompressorNode;
   isCompressorConnected: boolean;

  private filterbank: { idx: number; filters: BiquadFilterNode[] }[] = [];

  private readonly emitter: Emitter<WEQ8Events>;

  private DEFAULT_FIXED_SPEC:WEQ8Spec = [
    { type: "lowshelf12", frequency: 30, gain: 0, Q: 0.7, bypass: false },
    { type: "peaking12", frequency: 200, gain: 0, Q: 0.7, bypass: false },
    { type: "peaking12", frequency: 1000, gain: 0, Q: 0.7, bypass: false },
    { type: "highshelf12", frequency: 5000, gain: 0, Q: 0.7, bypass: false }, 
  ];


  private Bass: WEQ8Spec = [
    { type: "peaking12", frequency: 48, gain: 8.1, Q: 0.47, bypass: false },
    { type: "peaking12", frequency: 200, gain: 0, Q: 0.7, bypass: false },
    { type: "peaking12", frequency: 1000, gain: 0, Q: 0.7, bypass: false },
    { type: "highshelf12", frequency: 5000, gain: 0, Q: 0.7, bypass: false }, 

  ];

  private Voice: WEQ8Spec = [
    { type: "lowshelf12", frequency: 43, gain: 0.8, Q: 0.7, bypass: false },
    { type: "peaking12", frequency: 125, gain: -2.8, Q: 0.7, bypass: false },
    { type: "peaking12", frequency: 1000, gain: 5.2, Q: 0.7, bypass: false },
    { type: "highshelf12", frequency: 8400, gain: -4.0, Q: 0.7, bypass: false }, 

  ];


  private SoftBass: WEQ8Spec = [
    { type: "lowshelf12", frequency: 30, gain: 3.4, Q: 0.7, bypass: false },
    { type: "peaking12", frequency: 102, gain: 1.6, Q: 0.27, bypass: false },
    { type: "peaking12", frequency: 1000, gain: -0.6, Q: 0.7, bypass: false },
    { type: "highshelf12", frequency: 5500, gain: -1.7, Q: 0.7, bypass: false }, 
  ];


  







  private presets: { [name: string ]: {spec: WEQ8Spec, isPreconfigured: boolean }} =
   { "Bass": {spec:this.Bass, isPreconfigured: true },
     "Voice":{spec:this.Voice, isPreconfigured: true},
    "Soft Bass":{spec:this.SoftBass, isPreconfigured: true} }; 

  private presetNames: string[] = [ "Bass", "Voice", "Soft Bass"];

  constructor(
    public readonly audioCtx: BaseAudioContext,
    public spec: WEQ8Spec = DEFAULT_SPEC,
    public readonly supportedFilterTypes: FilterType[] = FILTER_TYPES
  ) {
    this.input = audioCtx.createGain();
    this.output = audioCtx.createGain();
    this.volumeNode = audioCtx.createGain();
    this.Compressor = audioCtx.createDynamicsCompressor();   

    this.isCompressorConnected = false;
 
    
    this.buildFilterChain(spec);
    this.emitter = createNanoEvents();




    this.setVolume(1);
  }

  connect(node: AudioNode): void {
    this.output.connect(node);
  }

/*  get input Node */

  connectInput(node: AudioNode): void{
    this.input.connect(node);
  }


  /*     */
  
  disconnect(node: AudioNode): void {
    this.output.disconnect(node);
  }

  on<E extends keyof WEQ8Events>(
    event: E,
    callback: WEQ8Events[E]
  ): Unsubscribe {
    return this.emitter.on(event, callback);
  }


  setVolume(level: number ):void {
   this.volumeNode.gain.value = level;
  // console.log(this.volumeNode.gain.value);
   this.emitter.emit("volumeChanged", level);
  }

  toggleCompressorConnection(): void {
    if (this.isCompressorConnected) {
      this.volumeNode.disconnect(this.Compressor);
      this.Compressor.disconnect(this.output);
      this.volumeNode.connect(this.output);
      this.isCompressorConnected = false;
    } else {
      this.volumeNode.disconnect(this.output);
      this.volumeNode.connect(this.Compressor);
      this.Compressor.connect(this.output);
      this.isCompressorConnected = true;
    }
  }


  setFilterType(idx: number, type: FilterType | "noop"): void {
    if (
      type === "noop" &&
      this.spec[idx].type !== "noop" &&
      !this.spec[idx].bypass
    ) {
      this.disconnectFilter(idx);
    } else if (
      type !== "noop" &&
      this.spec[idx].type === "noop" &&
      !this.spec[idx].bypass
    ) {
      this.connectFilter(idx, type);
    }
    this.spec[idx].type = type;
    if (type !== "noop" && !this.spec[idx].bypass) {
      let filters = this.filterbank.find((f) => f.idx === idx)?.filters;
      if (!filters) {
        throw new Error("Assertion failed: No filters in filterbank");
      }
      for (let filter of filters) {
        filter.type = getBiquadFilterType(type);
      }
      let order = getBiquadFilterOrder(type);
      while (filters.length > order) {
        let indexToRemove = filters.length - 1;
        let filterToRemove = filters[indexToRemove];
        let previous = filters[indexToRemove - 1];
        let next = this.getNextInChain(idx);
        filterToRemove.disconnect();
        previous.disconnect(filterToRemove);
        previous.connect(next);
        filters.splice(indexToRemove, 1);
      }
      while (filters.length < order) {
        let newFilter = this.audioCtx.createBiquadFilter();
        newFilter.type = getBiquadFilterType(type);
        newFilter.frequency.value = this.spec[idx].frequency;
        newFilter.Q.value = this.spec[idx].Q;
        newFilter.gain.value = this.spec[idx].gain;
        let previous = filters[filters.length - 1];
        let next = this.getNextInChain(idx);
        previous.disconnect(next);
        previous.connect(newFilter);
        newFilter.connect(next);
        filters.push(newFilter);
      }
    }
    this.emitter.emit("filtersChanged", this.spec);
  }

  toggleBypass(idx: number, bypass: boolean): void {
    if (bypass && !this.spec[idx].bypass && this.spec[idx].type !== "noop") {
      this.disconnectFilter(idx);
    } else if (
      !bypass &&
      this.spec[idx].bypass &&
      this.spec[idx].type !== "noop"
    ) {
      this.connectFilter(idx, this.spec[idx].type as FilterType);
    }
    this.spec[idx].bypass = bypass;
    this.emitter.emit("filtersChanged", this.spec);
  }

  private disconnectFilter(idx: number) {
    let filters = this.filterbank.find((f) => f.idx === idx)?.filters;
    if (!filters) {
      throw new Error(
        "Assertion failed: No filters in filterbank when disconnecting filter. Was it connected?"
      );
    }
    let previous = this.getPreviousInChain(idx);
    let next = this.getNextInChain(idx);
    previous.disconnect(filters[0]);
    filters[filters.length - 1].disconnect(next);
    previous.connect(next);
    this.filterbank = this.filterbank.filter((f) => f.idx !== idx);
  }

  private connectFilter(idx: number, type: FilterType) {
    let filters = Array.from({ length: getBiquadFilterOrder(type) }, () => {
      let newFilter = this.audioCtx.createBiquadFilter();
      newFilter.type = getBiquadFilterType(type);
      newFilter.frequency.value = this.spec[idx].frequency;
      newFilter.Q.value = this.spec[idx].Q;
      newFilter.gain.value = this.spec[idx].gain;
      return newFilter;
    });
    let previous = this.getPreviousInChain(idx);
    let next = this.getNextInChain(idx);
    previous.disconnect(next);
    previous.connect(filters[0]);
    for (let i = 0; i < filters.length - 1; i++) {
      filters[i].connect(filters[i + 1]);
    }
    filters[filters.length - 1].connect(next);
    this.filterbank.push({ idx, filters });
  }

  setFilterFrequency(idx: number, frequency: number): void {
    this.spec[idx].frequency = frequency;
    let bankEntry = this.filterbank.find((f) => f.idx === idx);
    if (bankEntry) {
      for (let filter of bankEntry.filters) {
        filter.frequency.value = frequency;
      }
    }
    this.emitter.emit("filtersChanged", this.spec);
   // console.log('setFilterFrequency Called');
  }

  setFilterQ(idx: number, Q: number): void {
    this.spec[idx].Q = Q;
    let bankEntry = this.filterbank.find((f) => f.idx === idx);
    if (bankEntry) {
      for (let filter of bankEntry.filters) {
        filter.Q.value = Q;
      }
    }
    this.emitter.emit("filtersChanged", this.spec);
   // console.log('setFilterQ Called');
  }

  setFilterGain(idx: number, gain: number): void {
    this.spec[idx].gain = gain;
    let bankEntry = this.filterbank.find((f) => f.idx === idx);
    if (bankEntry) {
      for (let filter of bankEntry.filters) {
        filter.gain.value = gain;
      }
    }
    this.emitter.emit("filtersChanged", this.spec);
  //  console.log(this.volumeNode.gain.value);
  }

  getFrequencyResponse(
    idx: number,
    filterIdx: number,
    frequencies: Float32Array,
    magResponse: Float32Array,
    phaseResponse: Float32Array
  ): boolean {
    let filter = this.filterbank.find((f) => f.idx === idx);
    if (filter) {
      filter.filters[filterIdx].getFrequencyResponse(
        frequencies,
        magResponse,
        phaseResponse
      );
      return true;
    } else {
      return false;
    }
  }

  private buildFilterChain(specs: WEQ8Spec): void {
    this.filterbank = [];
    for (let i = 0; i < specs.length; i++) {
      let spec = specs[i];
      if (spec.type === "noop" || spec.bypass) continue;
      let filters = Array.from(
        { length: getBiquadFilterOrder(spec.type) },
        () => {
          let filter = this.audioCtx.createBiquadFilter();
          filter.type = getBiquadFilterType(spec.type as FilterType);
          filter.frequency.value = spec.frequency;
          filter.Q.value = spec.Q;
          filter.gain.value = spec.gain;
          return filter;
        }
      );
      this.filterbank.push({ idx: i, filters });  
    }   


    if (this.filterbank.length === 0) {   
      this.input.connect(this.volumeNode);
  
    } else {
      for (let i = 0; i < this.filterbank.length; i++) {
        let { filters } = this.filterbank[i];
        if (i === 0) {
          this.input.connect(filters[0]);
        } else {
          this.filterbank[i - 1].filters[
            this.filterbank[i - 1].filters.length - 1
          ].connect(filters[0]);
        }
        for (let j = 0; j < filters.length - 1; j++) {
          filters[j].connect(filters[j + 1]);
        }
        if (i === this.filterbank.length - 1) {
          filters[filters.length - 1].connect(this.volumeNode);       
        }
        
      }
    }
       this.volumeNode.connect(this.output);

       console.log("buildFilterChain is called");
  }

  private getPreviousInChain(idx: number): AudioNode {
    let prev = this.input,
      prevIndex = -1;
    for (let filter of this.filterbank) {
      if (filter.idx < idx && filter.idx > prevIndex) {
        prev = filter.filters[filter.filters.length - 1];
        prevIndex = filter.idx;
      }
    }
    return prev;
  }

  private getNextInChain(idx: number): AudioNode {
    let next = this.volumeNode,
      nextIndex: number = this.spec.length;
    for (let filter of this.filterbank) {
      if (filter.idx > idx && filter.idx < nextIndex) {
        next = filter.filters[0];
        nextIndex = filter.idx;
      }
    }
    return next;
  }



  setFilterSpec(spec: WEQ8Spec)  {
     for(let i = 0 ; i < spec.length ; i++){
      const defaultFilter = spec[i];
      this.setFilterType(i, defaultFilter.type);
      this.setFilterFrequency(i, defaultFilter.frequency);
      this.setFilterQ(i, defaultFilter.Q);
      this.setFilterGain(i, defaultFilter.gain);
     }
     this.emitter.emit('filtersChanged', spec);
  }
  
  
  resetFilters(): void {
   this.setFilterSpec(this.DEFAULT_FIXED_SPEC);

  }


   /*   preset methods */

   getCurrentSpec(): WEQ8Spec {
    this.spec.forEach(filter => {
      console.log(`Type: ${filter.type}, Frequency: ${filter.frequency}, Gain: ${filter.gain}, Q: ${filter.Q}`);
  });
    return this.spec;
   }


   saveSpec(name:string ):void {
     this.presets[name] = {spec:JSON.parse(JSON.stringify(this.getCurrentSpec())), isPreconfigured: false};
     this.updatePresetNames();
   }


   loadSpec(name:string):void {
     const presetSpec = this.presets[name].spec;


     if(!presetSpec) {
      throw new Error(`Preset "${name}" not found`);
     } 

    
    this.setFilterSpec(presetSpec);
   } 
   

   updatePresetNames(): void {
    this.presetNames = Object.keys(this.presets);
}



   getPresetNames(): string[] {
       return this.presetNames;
   }


  
   deleteSpec(name : string) {

   if(!this.presets[name]) {
    console.warn(`Preset "${name}" not found.`);
    return;
   } 
   
   if(this.presets[name].isPreconfigured){
   alert(`Preset "${name}" is pre-configured and cannot be deleted`);
      return;
   }
  
     delete this.presets[name];
     this.updatePresetNames();  
   }
  


   setCompressorThreshold(value:number){
       if(this.isCompressorConnected){
     this.Compressor.threshold.setValueAtTime(value, this.audioCtx.currentTime);
   } else {
    return;
   }
   this.emitter.emit("CompressorChanged",value);
  }

   setCompressorAttack(value: number){
    if(this.isCompressorConnected){
      this.Compressor.attack.setValueAtTime(value, this.audioCtx.currentTime);
    } else {
    return;
    }
    this.emitter.emit("CompressorChanged",value);
   }

   setCompressorRatio(value: number){
    if(this.isCompressorConnected){
      this.Compressor.ratio.setValueAtTime(value, this.audioCtx.currentTime);
    } else {
    return;
    }
    this.emitter.emit("CompressorChanged",value);

   }


   VolumeNodeDisconnect(){
    if(this.isCompressorConnected){
      this.volumeNode.disconnect(this.Compressor)
    } else {
      this.volumeNode.disconnect(this.output);   
    }

    //this.emitter.emit("volumeChanged", this.volumeNode.gain.value);
   }
   
   
   VolumeNodeConnect(){
    if(this.isCompressorConnected){
      this.volumeNode.connect(this.Compressor)
    } else {
      this.volumeNode.connect(this.output);   
    }

   // this.emitter.emit("volumeChanged", this.volumeNode.gain.value);
   }

}

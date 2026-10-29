import React from 'react';
import {Composition, Still, registerRoot} from 'remotion';
import {ReleaseFilm, ReleasePoster, duration, type Props} from './films';
const voxtral:Props={film:'voxtral',releaseStatus:'preview'};
const jev:Props={film:'jev',releaseStatus:'preview'};
const Root=()=> <>
  <Composition id="VoxtralVideo" component={ReleaseFilm} defaultProps={voxtral} width={1080} height={1350} fps={30} durationInFrames={duration('voxtral')*30}/>
  <Composition id="JevVideo" component={ReleaseFilm} defaultProps={jev} width={1080} height={1350} fps={30} durationInFrames={duration('jev')*30}/>
  <Still id="VoxtralPoster" component={ReleasePoster} defaultProps={voxtral} width={1080} height={1350}/>
  <Still id="JevPoster" component={ReleasePoster} defaultProps={jev} width={1080} height={1350}/>
</>;
registerRoot(Root);

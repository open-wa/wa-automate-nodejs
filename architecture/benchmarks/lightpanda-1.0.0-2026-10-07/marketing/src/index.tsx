import React from 'react';
import {Composition, registerRoot, Still} from 'remotion';
import {LaunchFilm, Poster} from './launch';

const Root = () => <>
  <Composition id="LightpandaLaunch" component={LaunchFilm} width={1080} height={1350} fps={30} durationInFrames={960}/>
  <Still id="LightpandaPoster" component={Poster} width={1080} height={1350}/>
</>;

registerRoot(Root);

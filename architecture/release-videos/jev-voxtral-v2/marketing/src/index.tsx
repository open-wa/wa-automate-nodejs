import React from 'react';
import {Composition,Still,registerRoot} from 'remotion';
import {Movie,seconds} from './film';
const Root=()=> <>{(['voxtral','jev'] as const).map(film=><React.Fragment key={film}><Composition id={film} component={Movie} defaultProps={{film}} width={1920} height={1080} fps={30} durationInFrames={seconds*30}/><Still id={`${film}Poster`} component={Movie} defaultProps={{film,poster:true}} width={1920} height={1080}/></React.Fragment>)}</>;
registerRoot(Root);

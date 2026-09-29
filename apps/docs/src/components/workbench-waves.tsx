import { Waves } from '@paper-design/shaders-react';

/** Paper's approved workbench texture; static and limited to the hero. */
export default function WorkbenchWaves() {
  return <Waves scale={0.6} rotation={0} frequency={0.28} amplitude={0.25}
    spacing={1.2} proportion={0.1} softness={0} shape={0}
    colorBack="#00000000" colorFront="#FFBB00" maxPixelCount={300000}
    aria-hidden="true" className="workbench-waves" />;
}

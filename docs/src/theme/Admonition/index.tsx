import React from 'react';
import Admonition from '@theme-original/Admonition';

export default function AdmonitionWrapper(props) {
  console.log("🚀 ~ AdmonitionWrapper ~ props:", props.type)
  if (props.type == 'license') {
    return <Admonition icon="🏅" {...props} />;
  }

  return (
    <>
      <Admonition {...props} />
    </>
  );
}

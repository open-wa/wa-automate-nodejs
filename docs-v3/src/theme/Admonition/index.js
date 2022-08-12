import React from 'react';
import Admonition from '@theme-original/Admonition';

export default function AdmonitionWrapper(props) {
  if (props.type == 'license') {
    return <Admonition icon="🏅" {...props} />;
  }

  return (
    <>
      <Admonition {...props} />
    </>
  );
}

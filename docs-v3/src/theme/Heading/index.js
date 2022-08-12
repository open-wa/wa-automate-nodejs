import React from 'react';
import Heading from '@theme-original/Heading';

export default function HeadingWrapper(props) {
  let _id = props.id;
  if(props.as === 'h3') {
    if(Array.isArray(props.children)) _id = props.children[0].trim().toLowerCase();
  }
  return (
    <>
      <Heading {...props} id={_id} />
    </>
  );
}

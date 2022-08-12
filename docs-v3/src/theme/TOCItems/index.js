import React from 'react';
import TOCItems from '@theme-original/TOCItems';

export default function TOCItemsWrapper(props) {
  const newTocTree = props.toc.map(tocItem => {
    if(tocItem.level == 3) tocItem.id = tocItem.id.split("-")[0]
    return tocItem
  })
  return (
    <>
      <TOCItems {...props} toc={newTocTree} />
    </>
  );
}

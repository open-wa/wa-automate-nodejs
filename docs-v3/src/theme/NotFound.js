import React from 'react';
import NotFound from '@theme-original/NotFound';
import {Redirect} from '@docusaurus/router';

export default function NotFoundWrapper(props) {
  console.log(props.location)
  if(props.location && props.location.pathname && props.location.pathname.includes('/api_') && !props.location.pathname.startsWith('/docs/api')) {
    const redirectUrl = `/docs/api${props.location.pathname}${(props.location.hash || '').toLowerCase()}`
    return (
    <>
    <Redirect to={redirectUrl} />
    </>);
  }
  return (
    <>
      <NotFound {...props} />
    </>
  );
}

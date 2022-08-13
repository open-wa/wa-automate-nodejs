"use strict";(self.webpackChunkdocs_v_3=self.webpackChunkdocs_v_3||[]).push([[3985],{3905:(e,t,a)=>{a.d(t,{Zo:()=>c,kt:()=>u});var r=a(7294);function n(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function l(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,r)}return a}function i(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?l(Object(a),!0).forEach((function(t){n(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):l(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function o(e,t){if(null==e)return{};var a,r,n=function(e,t){if(null==e)return{};var a,r,n={},l=Object.keys(e);for(r=0;r<l.length;r++)a=l[r],t.indexOf(a)>=0||(n[a]=e[a]);return n}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(r=0;r<l.length;r++)a=l[r],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(n[a]=e[a])}return n}var p=r.createContext({}),s=function(e){var t=r.useContext(p),a=t;return e&&(a="function"==typeof e?e(t):i(i({},t),e)),a},c=function(e){var t=s(e.components);return r.createElement(p.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},m=r.forwardRef((function(e,t){var a=e.components,n=e.mdxType,l=e.originalType,p=e.parentName,c=o(e,["components","mdxType","originalType","parentName"]),m=s(a),u=n,f=m["".concat(p,".").concat(u)]||m[u]||d[u]||l;return a?r.createElement(f,i(i({ref:t},c),{},{components:a})):r.createElement(f,i({ref:t},c))}));function u(e,t){var a=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var l=a.length,i=new Array(l);i[0]=m;var o={};for(var p in t)hasOwnProperty.call(t,p)&&(o[p]=t[p]);o.originalType=e,o.mdxType="string"==typeof e?e:n,i[1]=o;for(var s=2;s<l;s++)i[s]=a[s];return r.createElement.apply(null,i)}return r.createElement.apply(null,a)}m.displayName="MDXCreateElement"},9019:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>p,contentTitle:()=>i,default:()=>d,frontMatter:()=>l,metadata:()=>o,toc:()=>s});var r=a(7462),n=(a(7294),a(3905));const l={id:"api_model_label.Label",title:"Interface: Label",sidebar_label:"Label",custom_edit_url:null},i=void 0,o={unversionedId:"api/interfaces/api_model_label.Label",id:"api/interfaces/api_model_label.Label",title:"Interface: Label",description:"api/model/label.Label",source:"@site/docs/api/interfaces/api_model_label.Label.md",sourceDirName:"api/interfaces",slug:"/api/interfaces/api_model_label.Label",permalink:"/docs/api/interfaces/api_model_label.Label",draft:!1,editUrl:null,tags:[],version:"current",frontMatter:{id:"api_model_label.Label",title:"Interface: Label",sidebar_label:"Label",custom_edit_url:null},sidebar:"tutorialSidebar",previous:{title:"Id",permalink:"/docs/api/interfaces/api_model_id.Id"},next:{title:"Message",permalink:"/docs/api/interfaces/api_model_message.Message"}},p={},s=[{value:"Properties",id:"properties",level:2},{value:"id",id:"id",level:3},{value:"items",id:"items",level:3},{value:"name",id:"name",level:3}],c={toc:s};function d(e){let{components:t,...a}=e;return(0,n.kt)("wrapper",(0,r.Z)({},c,a,{components:t,mdxType:"MDXLayout"}),(0,n.kt)("p",null,(0,n.kt)("a",{parentName:"p",href:"/docs/api/modules/api_model_label"},"api/model/label"),".Label"),(0,n.kt)("h2",{id:"properties"},"Properties"),(0,n.kt)("h3",{id:"id"},"id"),(0,n.kt)("p",null,"\u2022 ",(0,n.kt)("strong",{parentName:"p"},"id"),": ",(0,n.kt)("inlineCode",{parentName:"p"},"string")),(0,n.kt)("p",null,'The internal ID of the label. Usually a number represented as a string e.g "1"'),(0,n.kt)("hr",null),(0,n.kt)("h3",{id:"items"},"items"),(0,n.kt)("p",null,"\u2022 ",(0,n.kt)("strong",{parentName:"p"},"items"),": { ",(0,n.kt)("inlineCode",{parentName:"p"},"id"),": ",(0,n.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.ChatId"},(0,n.kt)("inlineCode",{parentName:"a"},"ChatId"))," ","|"," ",(0,n.kt)("a",{parentName:"p",href:"/docs/api/types/api_model_aliases.MessageId"},(0,n.kt)("inlineCode",{parentName:"a"},"MessageId"))," ; ",(0,n.kt)("inlineCode",{parentName:"p"},"type"),": ",(0,n.kt)("inlineCode",{parentName:"p"},'"Chat"')," ","|"," ",(0,n.kt)("inlineCode",{parentName:"p"},'"Contact"')," ","|"," ",(0,n.kt)("inlineCode",{parentName:"p"},'"Message"'),"  }[]"),(0,n.kt)("p",null,"The items that are tagged with this label"),(0,n.kt)("hr",null),(0,n.kt)("h3",{id:"name"},"name"),(0,n.kt)("p",null,"\u2022 ",(0,n.kt)("strong",{parentName:"p"},"name"),": ",(0,n.kt)("inlineCode",{parentName:"p"},"string")),(0,n.kt)("p",null,"The text contents of the label"))}d.isMDXComponent=!0}}]);
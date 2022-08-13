"use strict";(self.webpackChunkdocs_v_3=self.webpackChunkdocs_v_3||[]).push([[5273],{3905:(e,t,r)=>{r.d(t,{Zo:()=>u,kt:()=>m});var n=r(7294);function o(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function a(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function s(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?a(Object(r),!0).forEach((function(t){o(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):a(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function l(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r,n,o={},a=Object.keys(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}var i=n.createContext({}),p=function(e){var t=n.useContext(i),r=t;return e&&(r="function"==typeof e?e(t):s(s({},t),e)),r},u=function(e){var t=p(e.components);return n.createElement(i.Provider,{value:t},e.children)},c={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var r=e.components,o=e.mdxType,a=e.originalType,i=e.parentName,u=l(e,["components","mdxType","originalType","parentName"]),d=p(r),m=o,O=d["".concat(i,".").concat(m)]||d[m]||c[m]||a;return r?n.createElement(O,s(s({ref:t},u),{},{components:r})):n.createElement(O,s({ref:t},u))}));function m(e,t){var r=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=r.length,s=new Array(a);s[0]=d;var l={};for(var i in t)hasOwnProperty.call(t,i)&&(l[i]=t[i]);l.originalType=e,l.mdxType="string"==typeof e?e:o,s[1]=l;for(var p=2;p<a;p++)s[p]=r[p];return n.createElement.apply(null,s)}return n.createElement.apply(null,r)}d.displayName="MDXCreateElement"},6220:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>i,contentTitle:()=>s,default:()=>c,frontMatter:()=>a,metadata:()=>l,toc:()=>p});var n=r(7462),o=(r(7294),r(3905));const a={id:"structures_preProcessors.PREPROCESSORS",title:"Enumeration: PREPROCESSORS",sidebar_label:"PREPROCESSORS",custom_edit_url:null},s=void 0,l={unversionedId:"api/enums/structures_preProcessors.PREPROCESSORS",id:"api/enums/structures_preProcessors.PREPROCESSORS",title:"Enumeration: PREPROCESSORS",description:"structures/preProcessors.PREPROCESSORS",source:"@site/docs/api/enums/structures_preProcessors.PREPROCESSORS.md",sourceDirName:"api/enums",slug:"/api/enums/structures_preProcessors.PREPROCESSORS",permalink:"/docs/api/enums/structures_preProcessors.PREPROCESSORS",draft:!1,editUrl:null,tags:[],version:"current",frontMatter:{id:"structures_preProcessors.PREPROCESSORS",title:"Enumeration: PREPROCESSORS",sidebar_label:"PREPROCESSORS",custom_edit_url:null},sidebar:"tutorialSidebar",previous:{title:"ValidationType",permalink:"/docs/api/enums/structures_Dialog.ValidationType"},next:{title:"Client",permalink:"/docs/api/classes/api_Client.Client"}},i={},p=[{value:"Enumeration Members",id:"enumeration-members",level:2},{value:"AUTO_DECRYPT",id:"auto_decrypt",level:3},{value:"AUTO_DECRYPT_SAVE",id:"auto_decrypt_save",level:3},{value:"BODY_ONLY",id:"body_only",level:3},{value:"SCRUB",id:"scrub",level:3},{value:"UPLOAD_CLOUD",id:"upload_cloud",level:3}],u={toc:p};function c(e){let{components:t,...r}=e;return(0,o.kt)("wrapper",(0,n.Z)({},u,r,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"/docs/api/modules/structures_preProcessors"},"structures/preProcessors"),".PREPROCESSORS"),(0,o.kt)("p",null,"A set of easy to use, built-in message processors."),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/open-wa/wa-automate-nodejs/blob/master/src/structures/preProcessors.ts"},"Check out the processor code here")),(0,o.kt)("h2",{id:"enumeration-members"},"Enumeration Members"),(0,o.kt)("h3",{id:"auto_decrypt"},"AUTO","_","DECRYPT"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("strong",{parentName:"p"},"AUTO","_","DECRYPT")," = ",(0,o.kt)("inlineCode",{parentName:"p"},'"AUTO_DECRYPT"')),(0,o.kt)("p",null,"Replaces the media thumbnail base64 in ",(0,o.kt)("inlineCode",{parentName:"p"},"body")," with the actual file's DataURL."),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"auto_decrypt_save"},"AUTO","_","DECRYPT","_","SAVE"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("strong",{parentName:"p"},"AUTO","_","DECRYPT","_","SAVE")," = ",(0,o.kt)("inlineCode",{parentName:"p"},'"AUTO_DECRYPT_SAVE"')),(0,o.kt)("p",null,"Automatically saves the file in a folder named ",(0,o.kt)("inlineCode",{parentName:"p"},"/media")," relative to the process working directory."),(0,o.kt)("p",null,"PLEASE NOTE, YOU WILL NEED TO MANUALLY CLEAR THIS FOLDER!!!"),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"body_only"},"BODY","_","ONLY"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("strong",{parentName:"p"},"BODY","_","ONLY")," = ",(0,o.kt)("inlineCode",{parentName:"p"},'"BODY_ONLY"')),(0,o.kt)("p",null,"A preprocessor that limits the amount of base64 data is present in the message object by removing duplication of ",(0,o.kt)("inlineCode",{parentName:"p"},"body")," in ",(0,o.kt)("inlineCode",{parentName:"p"},"content")," by replacing ",(0,o.kt)("inlineCode",{parentName:"p"},"content")," with ",(0,o.kt)("inlineCode",{parentName:"p"},'""'),"."),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"scrub"},"SCRUB"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("strong",{parentName:"p"},"SCRUB")," = ",(0,o.kt)("inlineCode",{parentName:"p"},'"SCRUB"')),(0,o.kt)("p",null,"This preprocessor scrubs ",(0,o.kt)("inlineCode",{parentName:"p"},"body")," and ",(0,o.kt)("inlineCode",{parentName:"p"},"content")," from media messages.\nThis would be useful if you want to reduce the message object size because neither of these values represent the actual file, only the thumbnail."),(0,o.kt)("hr",null),(0,o.kt)("h3",{id:"upload_cloud"},"UPLOAD","_","CLOUD"),(0,o.kt)("p",null,"\u2022 ",(0,o.kt)("strong",{parentName:"p"},"UPLOAD","_","CLOUD")," = ",(0,o.kt)("inlineCode",{parentName:"p"},'"UPLOAD_CLOUD"')),(0,o.kt)("p",null,"Uploads file to a cloud storage provider (GCP/AWS for now)."),(0,o.kt)("p",null,"If this preprocessor is set then you have to also set ",(0,o.kt)("a",{parentName:"p",href:"https://docs.openwa.dev/interfaces/api_model_config.ConfigObject.html#cloudUploadOptions"},(0,o.kt)("inlineCode",{parentName:"a"},"cloudUploadOptions"))," in the config."))}c.isMDXComponent=!0}}]);
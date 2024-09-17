export const GetLicenseNavBarButton = () => {
    return (
        <a className="navbar-lic-button" onClick={()=>{
            if(window.posthog) window.posthog.capture('click_checkout');
        }} href="https://gum.co/BTMt?tier=1%20Restricted%20License">Get License</a>
    )
}
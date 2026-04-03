import { useState, useEffect, useCallback, useRef } from "react";

// ─── DEFAULT DATA ───
const DEFAULT_REVIEWS = [
  { id:1, plat:"google", author:"Sarah Mitchell", rating:5, text:"Best dental cleaning I've ever had! Dr. Johnson was amazing and the staff was incredibly friendly. Highly recommend!", date:"Mar 30", status:"auto_replied", sentiment:"positive", reply:"Thank you so much, Sarah! Dr. Johnson and our team love hearing this. Your comfort is always our priority — see you next visit!", at:"10:02 AM" },
  { id:2, plat:"google", author:"Marcus Davis", rating:1, text:"Terrible experience. Waited over an hour past my appointment. Receptionist was rude when I asked about the delay. Charged full amount despite shortened visit.", date:"Mar 30", status:"recovery", sentiment:"negative", stage:"alert_sent", priv:"Hi Marcus, this is the owner and I'm personally reaching out. Your experience was completely unacceptable. I've spoken with our front desk team about what happened. I'd like to offer you a complimentary visit and my direct number for future appointments. Would you be open to a quick call?" },
  { id:3, plat:"yelp", author:"Jessica Torres", rating:4, text:"Great food and atmosphere! Tacos were incredible. Only 4 stars because of the 30-min wait on a Tuesday night. Would definitely come back.", date:"Mar 29", status:"auto_replied", sentiment:"positive", reply:"Thanks Jessica! Our tacos are our pride. We hear you on the wait — working on it. Can't wait to have you back!", at:"2:15 PM" },
  { id:4, plat:"google", author:"David Chen", rating:2, text:"AC was fixed but technician tracked mud through my house. Also overcharged compared to the quote. Disappointed.", date:"Mar 29", status:"recovery", sentiment:"negative", stage:"response_ready", priv:"Hi David, I'm the owner and I want to personally apologize. Tracking mud into your home is inexcusable. I'm issuing a refund for the price difference immediately and sending our team back at no charge to clean up. Can I call you today?" },
  { id:5, plat:"facebook", author:"Amanda Wright", rating:5, text:"My go-to salon for 2 years! Lisa always knows exactly what I want. The renovation looks beautiful.", date:"Mar 28", status:"auto_replied", sentiment:"positive", reply:"Amanda, you're the best! Lisa loves working with you!", at:"9:30 AM" },
  { id:6, plat:"google", author:"Robert Kim", rating:3, text:"Decent gym, clean equipment. Gets really crowded 5-7pm and not enough squat racks. Considering switching.", date:"Mar 28", status:"pending", sentiment:"neutral" },
  { id:7, plat:"yelp", author:"Nina Patel", rating:5, text:"Wedding cake was absolutely STUNNING. Everyone raving. Worth every penny!", date:"Mar 27", status:"auto_replied", sentiment:"positive", reply:"Nina, congratulations! So thrilled the cake was a hit!", at:"11:45 AM" },
  { id:8, plat:"google", author:"Tommy Reeves", rating:1, text:"Found a hair in my food. Waiter shrugged. Manager never came over. Disgusting.", date:"Mar 27", status:"recovery", sentiment:"negative", stage:"owner_reviewing", priv:"Tommy, I cannot apologize enough. This is a serious failure. I've launched an immediate investigation. I want to offer a full refund plus dinner for two on me. Please call me directly." },
  { id:9, plat:"facebook", author:"Lisa Huang", rating:4, text:"Great plants, knowledgeable staff. Prices higher than Home Depot but quality is worth it.", date:"Mar 26", status:"auto_replied", sentiment:"positive", reply:"Thanks Lisa! We hand-select every plant for quality!", at:"4:20 PM" },
  { id:10, plat:"google", author:"Carlos Mendez", rating:5, text:"Fixed my transmission in 2 days when dealer said 2 weeks. Saved $800. Honest and fast.", date:"Mar 25", status:"review_requested", sentiment:"positive", reply:"Carlos, speed and fair pricing is what we do. Drive safe!", at:"8:50 AM" },
];

const COMPETITORS = [
  { name: "Your Business", rating: 4.3, reviews: 127, trend: "+0.5" },
  { name: "Mario's Kitchen", rating: 4.1, reviews: 89, trend: "+0.1" },
  { name: "The Corner Spot", rating: 3.9, reviews: 203, trend: "-0.2" },
  { name: "Downtown Grill", rating: 3.6, reviews: 54, trend: "0.0" },
];

const ACTIONS = {
  alert_sent: [{ i:"📧",t:"Send private apology",p:"high" },{ i:"📞",t:"Call within 24 hours",p:"high" },{ i:"🎁",t:"Offer 50% off next visit",p:"med" },{ i:"💬",t:"Post empathetic public reply",p:"high" }],
  response_ready: [{ i:"✅",t:"Approve public response",p:"high" },{ i:"📧",t:"Send private resolution",p:"high" },{ i:"💰",t:"Issue partial refund",p:"med" },{ i:"📋",t:"Schedule team training",p:"low" }],
  owner_reviewing: [{ i:"🚨",t:"Respond within 2 hours",p:"high" },{ i:"📧",t:"Send personal apology + offer",p:"high" },{ i:"🎁",t:"Full refund + free service",p:"high" },{ i:"📋",t:"Investigate root cause",p:"high" }],
};

const PLANS = [
  { n:"Starter",pr:29,d:"AI Replies",feat:["AI responses","Google only","Email alerts","50 replies/mo","Tone training"],pop:false },
  { n:"Growth",pr:49,d:"Auto + Protection",feat:["Everything in Starter","Auto-reply 4-5 stars","Google+Yelp+Facebook","SMS+Email alerts","Unlimited replies","Negative alerts"],pop:true },
  { n:"Empire",pr:99,d:"Full Revenue System",feat:["Everything in Growth","Recovery + Private Messages","Revenue Impact Calculator","Competitor Intelligence","Review Growth Engine","Multi-location","White-label"],pop:false },
];

// ─── STRIPE ───
const STRIPE_PK="pk_test_51THwx7D9hCS6GeqLw2wynflPtTkO48TQPUUWVBVlPYzOsQWlBO1P7ZsLf9zJ1AqHKNrz88o7Q99Omyf01uZ2q5vC00LpXxOBkV";

const PLAN_FEATURES={
  free:["dashboard"],
  starter:["dashboard","reviews","profile","pricing"],
  growth:["dashboard","reviews","recovery","profile","growth","pricing"],
  empire:["dashboard","reviews","recovery","profile","roi","growth","settings","pricing"]
};

const PLAN_PRICE_IDS={
  starter:"price_starter_29",
  growth:"price_growth_49",
  empire:"price_empire_99"
};

// ─── THEME ───
const F="'DM Sans',system-ui,sans-serif";
const D="'Instrument Serif','Georgia',serif";
const bg="#FAFAF7";const cd="#FFFFFF";const bd="#E5E2DC";const tx="#18170F";const sb="#8A8578";const ac="#1A5C3A";

// ─── SHARED COMPONENTS ───
const Stars=({c,s=13})=><span style={{display:"inline-flex",gap:1}}>{[1,2,3,4,5].map(i=><svg key={i} width={s} height={s} viewBox="0 0 24 24" fill={i<=c?"#D97706":"#E5E7EB"} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}</span>;
const PI=({p})=>{const m={google:{b:"#4285F4",l:"G"},yelp:{b:"#D32323",l:"Y"},facebook:{b:"#1877F2",l:"f"}};const x=m[p]||m.google;return<span style={{background:x.b,color:"#fff",fontSize:9,fontWeight:800,width:22,height:22,borderRadius:6,display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{x.l}</span>};
const Pill=({t,children})=>{const c={auto_replied:{bg:"#ECFDF5",c:"#047857",b:"#A7F3D0"},pending:{bg:"#FFFBEB",c:"#A16207",b:"#FDE68A"},recovery:{bg:"#FEF2F2",c:"#B91C1C",b:"#FECACA"},review_requested:{bg:"#EEF2FF",c:"#4338CA",b:"#C7D2FE"}};const s=c[t]||c.pending;return<span style={{background:s.bg,color:s.c,border:`1px solid ${s.b}`,fontSize:9,fontWeight:700,padding:"2px 9px",borderRadius:20}}>{children}</span>};
const TM={positive:{e:"😊",l:"Warm",c:"#047857"},neutral:{e:"🤝",l:"Attentive",c:"#A16207"},negative:{e:"🛡️",l:"Empathetic",c:"#B91C1C"}};

const Input=({label,value,onChange,type="text",placeholder=""})=>(
  <div style={{marginBottom:14}}>
    <label style={{fontSize:11,fontWeight:600,color:sb,display:"block",marginBottom:5}}>{label}</label>
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",padding:"10px 14px",border:`1px solid ${bd}`,borderRadius:8,fontSize:13,fontFamily:F,color:tx,background:cd,boxSizing:"border-box",outline:"none"}}/>
  </div>
);

const Btn=({children,onClick,primary=true,full=false,disabled=false,style:s={}})=>(
  <button disabled={disabled} onClick={onClick} style={{background:disabled?"#C5C0B8":primary?ac:"#EFECEA",color:primary?"#fff":tx,border:primary?"none":`1px solid ${bd}`,padding:"11px 24px",borderRadius:8,fontSize:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontFamily:F,width:full?"100%":"auto",opacity:disabled?0.6:1,...s}}>{children}</button>
);

// ─── MAIN APP ───
export default function RAS(){
  // Auth state
  const[authState,setAuth]=useState("loading"); // loading, login, signup, onboarding, app
  const[user,setUser]=useState(null);

  // Onboarding state
  const[obStep,setOB]=useState(0);
  const[bizName,setBN]=useState("");
  const[bizType,setBT]=useState("restaurant");
  const[bizPhone,setBP]=useState("");
  const[bizEmail,setBE]=useState("");
  const[bizAddr,setBA]=useState("");
  const[bizWebsite,setBW]=useState("");
  const[toneStyle,setTS]=useState("professional");
  const[toneCustom,setTC]=useState("");
  const[platforms,setPlatforms]=useState({google:true,yelp:false,facebook:false});

  // App state
  const[reviews,setR]=useState(DEFAULT_REVIEWS);
  const[tab,setTab]=useState("dashboard");
  const[sel,setSel]=useState(null);
  const[ai,setAi]=useState("");
  const[aiLoading,setAiL]=useState(false);
  const[ed,setEd]=useState("");
  const[filt,setFilt]=useState("all");
  const[toast,setT]=useState("");
  const[msgT,setMT]=useState("public");
  const[niche,setN]=useState("restaurant");
  const[monthlyRev,setMR]=useState(30000);
  const[settingsTab,setSTB]=useState("business");

  // Login form
  const[loginEmail,setLE]=useState("");
  const[loginPass,setLP]=useState("");
  const[signName,setSN]=useState("");
  const[signEmail,setSE]=useState("");
  const[signPass,setSP]=useState("");

  // Stripe / Plan state
  const[currentPlan,setCP]=useState("empire"); // default all unlocked for demo
  const[showCheckout,setSC]=useState(null); // null or plan object
  const[cardName,setCN]=useState("");
  const[cardComplete,setCC]=useState(false);
  const[processing,setPR]=useState(false);
  const[stripeLoaded,setSL]=useState(false);
  const[stripeInstance,setSI]=useState(null);
  const[cardElement,setCE]=useState(null);
  const[subInfo,setSubI]=useState(null); // subscription info from backend
  const cardRef=useRef(null);
  const cardMounted=useRef(false);

  // Detect if running on Netlify (has serverless functions)
  const isNetlify=typeof window!=="undefined"&&(window.location.hostname.includes("netlify")||window.location.hostname==="localhost");

  // Stripe Price IDs — LIVE from Stripe Dashboard
  const PRICE_MAP={
    starter: "price_1THxPQD9hCS6GeqLbO8ygmAk",
    growth: "price_1THxQzD9hCS6GeqLpeP7RObU",
    empire: "price_1THxRfD9hCS6GeqLVvE2U7Ub",
  };

  // Load Stripe.js
  useEffect(()=>{
    if(document.querySelector('script[src*="js.stripe.com"]'))return;
    const script=document.createElement("script");
    script.src="https://js.stripe.com/v3/";
    script.async=true;
    script.onload=()=>{
      if(window.Stripe){
        const stripe=window.Stripe(STRIPE_PK);
        setSI(stripe);setSL(true);
      }
    };
    document.head.appendChild(script);
  },[]);

  // Mount Stripe card element when checkout opens (demo/fallback mode)
  useEffect(()=>{
    if(!isNetlify&&showCheckout&&stripeInstance&&cardRef.current&&!cardMounted.current){
      const elements=stripeInstance.elements({
        fonts:[{cssSrc:'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap'}]
      });
      const card=elements.create("card",{
        style:{
          base:{fontSize:"15px",fontFamily:"'DM Sans', sans-serif",color:"#18170F","::placeholder":{color:"#8A8578"},lineHeight:"24px"},
          invalid:{color:"#B91C1C"}
        },
        hidePostalCode:false
      });
      card.mount(cardRef.current);
      card.on("change",(e)=>setCC(e.complete));
      setCE(card);
      cardMounted.current=true;
    }
    if(!showCheckout){cardMounted.current=false;setCE(null);setCC(false);setCN("")}
  },[showCheckout,stripeInstance,isNetlify]);

  // Check for checkout success on page load (redirect back from Stripe)
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    if(params.get("checkout")==="success"){
      const plan=params.get("plan")||"growth";
      setCP(plan);
      window.storage.set("ras-plan",JSON.stringify({plan,created:new Date().toISOString(),source:"stripe_checkout"}));
      flash(`${plan.charAt(0).toUpperCase()+plan.slice(1)} plan activated! 🎉`);
      window.history.replaceState({},"",window.location.pathname);
    }
  },[]);

  // Fetch subscription status from backend
  const checkSubscription=async()=>{
    if(!isNetlify||!user?.email)return;
    try{
      const res=await fetch("/.netlify/functions/manage-subscription",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"status",customerEmail:user.email})
      });
      const data=await res.json();
      if(data.plan&&data.plan!=="free"){setCP(data.plan);setSubI(data)}
    }catch(e){console.log("Could not fetch subscription status")}
  };

  // Process payment — two modes
  const handleCheckout=async()=>{
    setPR(true);

    // ─── MODE 1: NETLIFY (Production) — Stripe Checkout Session redirect ───
    if(isNetlify){
      try{
        const planKey=showCheckout.n.toLowerCase();
        const res=await fetch("/.netlify/functions/create-checkout",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            priceId:PRICE_MAP[planKey],
            planName:planKey,
            customerEmail:user?.email||"",
            customerName:user?.name||"",
          })
        });
        const data=await res.json();
        if(data.url){
          window.location.href=data.url; // Redirect to Stripe hosted checkout
        }else{
          flash("Checkout error: "+(data.error||"Unknown error"));
        }
      }catch(err){flash("Could not start checkout. Try again.")}
      setPR(false);
      return;
    }

    // ─── MODE 2: DEMO — Stripe Elements token (works in artifact preview) ───
    if(!stripeInstance||!cardElement||!cardComplete){setPR(false);return}
    try{
      const{token,error}=await stripeInstance.createToken(cardElement,{name:cardName||user?.name||"Customer"});
      if(error){flash("Card error: "+error.message);setPR(false);return}
      const planName=showCheckout.n.toLowerCase();
      setCP(planName);
      await window.storage.set("ras-plan",JSON.stringify({plan:planName,tokenId:token.id,last4:token.card.last4,brand:token.card.brand,created:new Date().toISOString()}));
      setSC(null);setPR(false);
      flash(`${showCheckout.n} plan activated! Card ending ${token.card.last4}`);
    }catch(err){
      flash("Payment failed. Please try again.");setPR(false);
    }
  };

  // Open Stripe Customer Portal (production only)
  const openBillingPortal=async()=>{
    if(!isNetlify||!user?.email)return;
    try{
      const res=await fetch("/.netlify/functions/manage-subscription",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"portal",customerEmail:user.email})
      });
      const data=await res.json();
      if(data.url)window.location.href=data.url;
    }catch(e){flash("Could not open billing portal")}
  };

  // ─── PERSISTENCE ───
  useEffect(()=>{
    (async()=>{
      try{
        const u=await window.storage.get("ras-user");
        if(u&&u.value){
          const parsed=JSON.parse(u.value);
          setUser(parsed);
          // Load saved data
          try{const rv=await window.storage.get("ras-reviews");if(rv)setR(JSON.parse(rv.value))}catch(e){}
          try{const st=await window.storage.get("ras-settings");if(st){const s=JSON.parse(st.value);setBN(s.bizName||"");setBT(s.bizType||"restaurant");setBP(s.bizPhone||"");setBE(s.bizEmail||"");setBA(s.bizAddr||"");setBW(s.bizWebsite||"");setTS(s.toneStyle||"professional");setTC(s.toneCustom||"");setPlatforms(s.platforms||{google:true,yelp:false,facebook:false});setN(s.bizType||"restaurant")}}catch(e){}
          try{const pl=await window.storage.get("ras-plan");if(pl){const p=JSON.parse(pl.value);setCP(p.plan||"empire")}}catch(e){}
          setAuth("app");
        } else {
          setAuth("login");
        }
      }catch(e){setAuth("login")}
    })();
  },[]);

  const saveUser=async(u)=>{try{await window.storage.set("ras-user",JSON.stringify(u))}catch(e){}};
  const saveReviews=async(r)=>{try{await window.storage.set("ras-reviews",JSON.stringify(r))}catch(e){}};
  const saveSettings=async()=>{try{await window.storage.set("ras-settings",JSON.stringify({bizName,bizType,bizPhone,bizEmail,bizAddr,bizWebsite,toneStyle,toneCustom,platforms}))}catch(e){}};

  // ─── STATS ───
  const s={total:reviews.length,auto:reviews.filter(r=>r.status==="auto_replied").length,rec:reviews.filter(r=>r.status==="recovery").length,avg:(reviews.reduce((a,r)=>a+r.rating,0)/reviews.length).toFixed(1),rate:Math.round((reviews.filter(r=>r.reply).length/reviews.length)*100),req:reviews.filter(r=>r.status==="review_requested").length};
  const jR=3.8;const gain=(parseFloat(s.avg)-jR).toFixed(1);
  const revImpactLow=Math.round(monthlyRev*(parseFloat(gain)/1)*0.05);
  const revImpactHigh=Math.round(monthlyRev*(parseFloat(gain)/1)*0.09);
  const list=filt==="all"?reviews:filt==="needs"?reviews.filter(r=>r.status==="pending"||r.status==="recovery"):reviews.filter(r=>r.status===filt);
  const flash=m=>{setT(m);setTimeout(()=>setT(""),3500)};

  // ─── REAL AI REPLY GENERATION ───
  const generateAIReply=useCallback(async(r,messageType="public")=>{
    setSel(r);setAiL(true);setAi("");setMT(messageType);
    const toneMap={professional:"Professional and warm",friendly:"Casual and friendly like a neighbor",formal:"Formal and corporate",witty:"Witty with personality but still respectful",empathetic:"Deeply empathetic and caring"};
    const toneDesc=toneMap[toneStyle]||toneCustom||"Professional and warm";
    const businessName=bizName||"our business";
    const businessType=bizType||"business";

    const systemPrompt=`You are an AI reputation manager for "${businessName}", a ${businessType}. Write a ${messageType==="private"?"private direct message":"public reply"} to a customer review.

TONE: ${toneDesc}
RULES:
- Keep it under 60 words for public, under 100 words for private
- Never be defensive or argumentative
- For negative reviews: acknowledge the issue, take responsibility, offer a specific resolution
- For positive reviews: express genuine gratitude, mention something specific from their review
- For private messages: be more personal, offer direct contact info placeholder [YOUR PHONE]
- Use the customer's first name
- Do NOT use generic phrases like "we value your feedback"
- Sound like a real human owner, not a corporation
- Match the ${businessType} industry context`;

    const userPrompt=`Customer: ${r.author}
Rating: ${r.rating}/5 stars
Platform: ${r.plat}
Review: "${r.text}"
Sentiment: ${r.sentiment}

Write a ${messageType} ${r.sentiment==="negative"?"recovery":"thank you"} response:`;

    try{
      const response=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:systemPrompt,
          messages:[{role:"user",content:userPrompt}]
        })
      });
      const data=await response.json();
      const text=data.content?.map(b=>b.type==="text"?b.text:"").join("")||"Could not generate reply. Please try again.";
      // Typewriter effect
      let i=0;
      const iv=setInterval(()=>{setAi(text.slice(0,i));i+=4;if(i>text.length){clearInterval(iv);setAiL(false);setEd(text)}},10);
    }catch(err){
      setAi("⚠️ Could not reach AI. Using template reply.");
      const fallback=r.sentiment==="negative"
        ?`${r.author.split(" ")[0]}, we sincerely apologize. This falls below our standard and we take full responsibility. Please reach out so we can make this right.`
        :`Thank you so much, ${r.author.split(" ")[0]}! Your kind words mean the world to our team. Can't wait to welcome you back!`;
      setAi(fallback);setEd(fallback);setAiL(false);
    }
  },[bizName,bizType,toneStyle,toneCustom]);

  const approve=()=>{
    const updated=reviews.map(r=>r.id===sel.id?{...r,status:"auto_replied",reply:ed,at:"Just now"}:r);
    setR(updated);saveReviews(updated);flash("Reply published!");setSel(null);setAi("");
  };

  const niches={restaurant:"Restaurants",barber:"Barbershops",dental:"Dental Practices",contractor:"Contractors",gym:"Gyms",salon:"Salons",auto:"Auto Shops",retail:"Retail",realestate:"Real Estate"};
  const tones=[{id:"professional",l:"Professional",d:"Warm & polished"},{id:"friendly",l:"Friendly",d:"Casual neighbor vibe"},{id:"formal",l:"Formal",d:"Corporate & buttoned-up"},{id:"witty",l:"Witty",d:"Personality-forward"},{id:"empathetic",l:"Empathetic",d:"Deeply caring"},{id:"custom",l:"Custom",d:"Your own voice"}];

  const navI=[{id:"dashboard",l:"Dashboard",ic:"◉"},{id:"reviews",l:"Reviews",ic:"💬"},{id:"recovery",l:"Recovery",ic:"🛡️"},{id:"profile",l:"Profile Score",ic:"📊"},{id:"roi",l:"ROI & Intel",ic:"💰"},{id:"growth",l:"Growth",ic:"📈"},{id:"settings",l:"Settings",ic:"⚙️"},{id:"pricing",l:"Pricing",ic:"💎"}];

  // ─── AUTH: LOGIN ───
  if(authState==="loading") return(
    <div style={{fontFamily:F,background:bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet"/>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:36,fontFamily:D,color:tx,marginBottom:8}}>R.A.S.</div>
        <div style={{fontSize:10,color:ac,fontWeight:700,letterSpacing:3}}>LOADING...</div>
      </div>
    </div>
  );

  if(authState==="login"||authState==="signup") return(
    <div style={{fontFamily:F,background:bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet"/>
      <div style={{width:420,background:cd,border:`1px solid ${bd}`,borderRadius:20,padding:"40px 36px",boxShadow:"0 12px 40px rgba(0,0,0,0.04)"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:38,fontFamily:D,color:tx,letterSpacing:-1}}>R.A.S.</div>
          <div style={{fontSize:8,color:ac,fontWeight:700,letterSpacing:3,marginBottom:6}}>REPUTATION AUTOMATED SYSTEM</div>
          <div style={{fontSize:13,color:sb}}>{authState==="login"?"Welcome back":"Create your account"}</div>
        </div>

        {authState==="signup"&&<Input label="FULL NAME" value={signName} onChange={setSN} placeholder="Your name"/>}
        <Input label="EMAIL" value={authState==="login"?loginEmail:signEmail} onChange={authState==="login"?setLE:setSE} type="email" placeholder="you@business.com"/>
        <Input label="PASSWORD" value={authState==="login"?loginPass:signPass} onChange={authState==="login"?setLP:setSP} type="password" placeholder="••••••••"/>

        <Btn full onClick={async()=>{
          const u={name:authState==="signup"?signName:"Business Owner",email:authState==="login"?loginEmail:signEmail,created:new Date().toISOString()};
          setUser(u);await saveUser(u);
          if(authState==="signup"){setAuth("onboarding")}
          else{
            // Check if they already onboarded
            try{const st=await window.storage.get("ras-settings");if(st)setAuth("app");else setAuth("onboarding")}catch(e){setAuth("onboarding")}
          }
        }} style={{marginTop:8,marginBottom:16}}>
          {authState==="login"?"Sign In":"Create Account"}
        </Btn>

        <div style={{textAlign:"center",fontSize:12,color:sb}}>
          {authState==="login"?<>Don't have an account? <span onClick={()=>setAuth("signup")} style={{color:ac,fontWeight:600,cursor:"pointer"}}>Sign up free</span></>
          :<>Already have an account? <span onClick={()=>setAuth("login")} style={{color:ac,fontWeight:600,cursor:"pointer"}}>Sign in</span></>}
        </div>

        {/* Demo bypass */}
        <div style={{borderTop:`1px solid ${bd}`,marginTop:20,paddingTop:16,textAlign:"center"}}>
          <span onClick={async()=>{
            const u={name:"Demo User",email:"demo@ras.ai",created:new Date().toISOString()};
            setUser(u);await saveUser(u);setAuth("onboarding");
          }} style={{fontSize:11,color:sb,cursor:"pointer",textDecoration:"underline"}}>
            Skip → Launch demo with sample data
          </span>
        </div>
      </div>
    </div>
  );

  // ─── ONBOARDING ───
  if(authState==="onboarding") return(
    <div style={{fontFamily:F,background:bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet"/>
      <div style={{width:540,background:cd,border:`1px solid ${bd}`,borderRadius:20,padding:"36px 40px",boxShadow:"0 12px 40px rgba(0,0,0,0.04)"}}>
        {/* Progress */}
        <div style={{display:"flex",gap:6,marginBottom:28}}>
          {["Business Info","Platforms","AI Tone"].map((step,i)=>(
            <div key={i} style={{flex:1}}>
              <div style={{height:4,borderRadius:2,background:i<=obStep?ac:"#E5E2DC",transition:"background 0.3s"}}/>
              <div style={{fontSize:9,color:i<=obStep?ac:sb,fontWeight:600,marginTop:4}}>{step}</div>
            </div>
          ))}
        </div>

        {/* Step 1: Business Info */}
        {obStep===0&&<div>
          <h2 style={{fontSize:24,fontFamily:D,color:tx,margin:"0 0 4px"}}>Tell us about your business</h2>
          <p style={{fontSize:12,color:sb,margin:"0 0 20px"}}>This helps R.A.S. write replies that sound like you.</p>
          <Input label="BUSINESS NAME" value={bizName} onChange={setBN} placeholder="e.g. Joe's Pizza"/>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,fontWeight:600,color:sb,display:"block",marginBottom:5}}>BUSINESS TYPE</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {Object.entries(niches).map(([k,v])=>(
                <button key={k} onClick={()=>{setBT(k);setN(k)}} style={{background:bizType===k?ac:"#EFECEA",color:bizType===k?"#fff":sb,border:"none",padding:"6px 14px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:F}}>{v}</button>
              ))}
            </div>
          </div>
          <Input label="BUSINESS PHONE" value={bizPhone} onChange={setBP} placeholder="(555) 123-4567"/>
          <Input label="BUSINESS EMAIL" value={bizEmail} onChange={setBE} type="email" placeholder="hello@yourbusiness.com"/>
          <Input label="ADDRESS" value={bizAddr} onChange={setBA} placeholder="123 Main St, City, State"/>
          <Input label="WEBSITE" value={bizWebsite} onChange={setBW} placeholder="https://yourbusiness.com"/>
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
            <Btn onClick={()=>setOB(1)}>Continue →</Btn>
          </div>
        </div>}

        {/* Step 2: Platforms */}
        {obStep===1&&<div>
          <h2 style={{fontSize:24,fontFamily:D,color:tx,margin:"0 0 4px"}}>Connect your review platforms</h2>
          <p style={{fontSize:12,color:sb,margin:"0 0 20px"}}>Select which platforms you want R.A.S. to monitor and reply on.</p>
          {[
            {id:"google",name:"Google Business Profile",desc:"The #1 platform for local search. Most impactful for SEO.",icon:"G",color:"#4285F4"},
            {id:"yelp",name:"Yelp",desc:"Critical for restaurants, home services, and local shops.",icon:"Y",color:"#D32323"},
            {id:"facebook",name:"Facebook",desc:"Recommendations and reviews from your social audience.",icon:"f",color:"#1877F2"}
          ].map(p=>(
            <div key={p.id} onClick={()=>setPlatforms(prev=>({...prev,[p.id]:!prev[p.id]}))} style={{display:"flex",alignItems:"center",gap:14,padding:16,background:platforms[p.id]?"#F5FAF7":cd,border:`1px solid ${platforms[p.id]?"#A7F3D0":bd}`,borderRadius:12,marginBottom:8,cursor:"pointer",transition:"all 0.2s"}}>
              <span style={{background:p.color,color:"#fff",fontSize:14,fontWeight:800,width:36,height:36,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>{p.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:tx}}>{p.name}</div>
                <div style={{fontSize:11,color:sb}}>{p.desc}</div>
              </div>
              <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${platforms[p.id]?ac:bd}`,background:platforms[p.id]?ac:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
                {platforms[p.id]&&<span style={{color:"#fff",fontSize:13,lineHeight:1}}>✓</span>}
              </div>
            </div>
          ))}
          <div style={{padding:12,background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:8,marginTop:12,fontSize:11,color:"#A16207"}}>
            ⚡ <b>Note:</b> Full API connection requires your platform credentials. For now, R.A.S. will work with your review data as you add it.
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:16}}>
            <Btn primary={false} onClick={()=>setOB(0)}>← Back</Btn>
            <Btn onClick={()=>setOB(2)}>Continue →</Btn>
          </div>
        </div>}

        {/* Step 3: Tone */}
        {obStep===2&&<div>
          <h2 style={{fontSize:24,fontFamily:D,color:tx,margin:"0 0 4px"}}>Train your AI voice</h2>
          <p style={{fontSize:12,color:sb,margin:"0 0 20px"}}>How should R.A.S. sound when replying to your customers?</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
            {tones.map(t=>(
              <div key={t.id} onClick={()=>setTS(t.id)} style={{padding:14,background:toneStyle===t.id?"#F5FAF7":cd,border:`1px solid ${toneStyle===t.id?"#A7F3D0":bd}`,borderRadius:10,cursor:"pointer",textAlign:"center",transition:"all 0.2s"}}>
                <div style={{fontSize:13,fontWeight:600,color:toneStyle===t.id?ac:tx}}>{t.l}</div>
                <div style={{fontSize:10,color:sb,marginTop:2}}>{t.d}</div>
              </div>
            ))}
          </div>
          {toneStyle==="custom"&&<div style={{marginBottom:14}}>
            <label style={{fontSize:11,fontWeight:600,color:sb,display:"block",marginBottom:5}}>DESCRIBE YOUR VOICE</label>
            <textarea value={toneCustom} onChange={e=>setTC(e.target.value)} placeholder="e.g. We're a family-owned shop that's been here 30 years. We talk like we know everyone by name. Casual but respectful." style={{width:"100%",minHeight:80,border:`1px solid ${bd}`,borderRadius:8,padding:10,fontSize:12,fontFamily:F,color:tx,boxSizing:"border-box",resize:"vertical"}}/>
          </div>}

          {/* Preview */}
          <div style={{background:"#F3F1EC",borderRadius:10,padding:16,marginBottom:16}}>
            <div style={{fontSize:9,color:ac,fontWeight:700,letterSpacing:2,marginBottom:8}}>AI TONE PREVIEW</div>
            <div style={{fontSize:11,color:sb,marginBottom:4}}>Sample negative review: "Service was slow, food was cold."</div>
            <div style={{fontSize:12,color:tx,lineHeight:1.7,fontStyle:"italic"}}>
              {toneStyle==="professional"&&`"We sincerely apologize for this experience. Cold food and slow service are not our standard. We'd love the chance to make this right — please reach out directly."`}
              {toneStyle==="friendly"&&`"Oh no, that's not the experience we want for anyone! We dropped the ball and we're sorry. Next time you come in, ask for the owner — lunch is on us!"`}
              {toneStyle==="formal"&&`"We regret that your visit did not meet our quality standards. We have addressed this with our kitchen and service teams. We welcome the opportunity to restore your confidence."`}
              {toneStyle==="witty"&&`"Cold food? That's our villain origin story. Seriously though, we messed up. We're fixing it. Come back and let us prove that was our worst day, not our every day."`}
              {toneStyle==="empathetic"&&`"I'm truly sorry you had this experience. You came to us expecting something great and we let you down. That matters to me personally. Can I call you to make this right?"`}
              {toneStyle==="custom"&&(toneCustom?"Your custom tone will be applied to all AI responses.":"Enter your custom voice description above.")}
            </div>
          </div>

          <div style={{display:"flex",justifyContent:"space-between"}}>
            <Btn primary={false} onClick={()=>setOB(1)}>← Back</Btn>
            <Btn onClick={async()=>{await saveSettings();setAuth("app");flash("Welcome to R.A.S.! 🚀")}}>Launch R.A.S. →</Btn>
          </div>
        </div>}
      </div>
    </div>
  );

  // ─── MAIN APP ───
  return(
    <div style={{fontFamily:F,background:bg,color:tx,minHeight:"100vh",display:"flex"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet"/>

      {/* SIDEBAR */}
      <nav style={{width:218,background:cd,borderRight:`1px solid ${bd}`,padding:"22px 12px",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"0 8px",marginBottom:28}}>
          <div style={{fontSize:22,fontWeight:400,color:tx,fontFamily:D,letterSpacing:-0.5,lineHeight:1.1}}>R.A.S.</div>
          <div style={{fontSize:8,color:ac,fontWeight:700,letterSpacing:2.5,marginTop:2}}>REPUTATION AUTOMATED SYSTEM</div>
          {bizName&&<div style={{fontSize:10,color:sb,marginTop:4,fontWeight:500}}>{bizName}</div>}
        </div>
        {navI.map(n=>{
          const planTabs=PLAN_FEATURES[currentPlan]||PLAN_FEATURES.empire;
          const locked=!planTabs.includes(n.id);
          return(
          <button key={n.id} onClick={()=>{if(locked){flash(`Upgrade your plan to access ${n.l}`);setTab("pricing")}else setTab(n.id)}} style={{background:tab===n.id?"#EFECEA":"transparent",border:"none",color:locked?"#C5C0B8":tab===n.id?ac:sb,padding:"9px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:tab===n.id?600:400,display:"flex",alignItems:"center",gap:8,marginBottom:1,fontFamily:F,textAlign:"left",width:"100%",opacity:locked?0.6:1}}>
            <span style={{fontSize:13,width:20,textAlign:"center"}}>{locked?"🔒":n.ic}</span>{n.l}
            {n.id==="recovery"&&s.rec>0&&!locked&&<span style={{marginLeft:"auto",background:"#B91C1C",color:"#fff",fontSize:8,fontWeight:800,width:16,height:16,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{s.rec}</span>}
          </button>
        )})}
        <div style={{flex:1}}/>

        {/* User */}
        <div style={{borderTop:`1px solid ${bd}`,paddingTop:12,marginTop:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 8px"}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:ac,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{(user?.name||"U")[0]}</div>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:tx}}>{user?.name||"User"}</div>
              <div style={{fontSize:9,color:sb}}>{user?.email||""}</div>
            </div>
          </div>
          <button onClick={async()=>{try{await window.storage.delete("ras-user");await window.storage.delete("ras-settings");await window.storage.delete("ras-reviews");await window.storage.delete("ras-plan")}catch(e){}setAuth("login");setUser(null)}} style={{background:"transparent",border:"none",color:sb,fontSize:10,cursor:"pointer",fontFamily:F,padding:"6px 8px",marginTop:4,width:"100%",textAlign:"left"}}>Sign out</button>
        </div>

        {/* Rating progress */}
        <div style={{background:"#EFECEA",borderRadius:10,padding:14,marginTop:10}}>
          <div style={{fontSize:8,color:ac,fontWeight:700,letterSpacing:1.5,marginBottom:6}}>RATING PROGRESS</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <span style={{fontSize:11,color:sb}}>{jR}</span>
            <span style={{fontSize:10,color:ac}}>→</span>
            <span style={{fontSize:18,fontWeight:700,color:ac,fontFamily:D}}>{s.avg}</span>
          </div>
          <div style={{background:"#DBD8D2",borderRadius:3,height:5,marginTop:6,overflow:"hidden"}}>
            <div style={{width:`${(parseFloat(s.avg)/5)*100}%`,height:"100%",background:ac,borderRadius:3}}/>
          </div>
          <div style={{fontSize:9,color:ac,fontWeight:600,marginTop:6,textAlign:"center"}}>+{gain} stars</div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main style={{flex:1,padding:"28px 36px",overflow:"auto",maxHeight:"100vh"}}>

        {/* DASHBOARD */}
        {tab==="dashboard"&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <h1 style={{fontSize:26,fontWeight:400,color:tx,margin:0,fontFamily:D}}>Command Center</h1>
            <div style={{fontSize:10,color:sb}}>AI Tone: <span style={{color:ac,fontWeight:600}}>{tones.find(t=>t.id===toneStyle)?.l||"Custom"}</span></div>
          </div>
          <p style={{fontSize:12,color:sb,margin:"0 0 22px"}}>Real-time reputation intelligence{bizName?` for ${bizName}`:""}</p>

          {s.rec>0&&<div onClick={()=>setTab("recovery")} style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:12,padding:"12px 18px",marginBottom:16,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:20}}>🚨</span>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:"#B91C1C"}}>{s.rec} Negative Reviews — Recovery Actions Ready</div><div style={{fontSize:11,color:sb}}>AI has drafted public replies + private messages</div></div>
            <span style={{color:"#B91C1C",fontSize:11,fontWeight:600}}>View →</span>
          </div>}

          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
            {[{i:"💬",v:s.total,l:"Reviews",u:"+3 this week",c:ac},{i:"🤖",v:s.rate+"%",l:"Response Rate",u:"Industry avg: 25%",c:"#2563EB"},{i:"⭐",v:s.avg,l:"Rating",u:`+${gain} since joining`,c:"#D97706"},{i:"💰",v:`$${revImpactLow.toLocaleString()}`,l:"Est. Revenue Impact",u:`Up to $${revImpactHigh.toLocaleString()}/mo`,c:ac}].map((x,i)=>(
              <div key={i} style={{background:cd,border:`1px solid ${bd}`,borderRadius:12,padding:"16px 18px"}}>
                <div style={{fontSize:18,marginBottom:4}}>{x.i}</div>
                <div style={{fontSize:24,fontWeight:400,color:tx,fontFamily:D,lineHeight:1}}>{x.v}</div>
                <div style={{fontSize:10,color:sb,marginTop:3}}>{x.l}</div>
                <div style={{fontSize:9,color:x.c,marginTop:2,fontWeight:600}}>{x.u}</div>
              </div>
            ))}
          </div>

          {/* Sentiment breakdown */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div style={{background:cd,border:`1px solid ${bd}`,borderRadius:12,padding:18}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <span style={{fontSize:14,fontFamily:D,color:tx}}>Rating Improvement</span>
                <Pill t="auto_replied">↑ {gain} stars</Pill>
              </div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <div style={{textAlign:"center",padding:"10px 18px",background:"#FEF2F2",borderRadius:8}}>
                  <div style={{fontSize:8,color:"#B91C1C",fontWeight:700}}>BEFORE</div>
                  <div style={{fontSize:24,fontFamily:D,color:"#B91C1C"}}>{jR}</div>
                </div>
                <div style={{flex:1,height:3,background:`linear-gradient(90deg,#FECACA,#A7F3D0)`,borderRadius:2}}/>
                <div style={{textAlign:"center",padding:"10px 18px",background:"#ECFDF5",borderRadius:8}}>
                  <div style={{fontSize:8,color:ac,fontWeight:700}}>NOW</div>
                  <div style={{fontSize:24,fontFamily:D,color:ac}}>{s.avg}</div>
                </div>
              </div>
            </div>

            <div style={{background:cd,border:`1px solid ${bd}`,borderRadius:12,padding:18}}>
              <span style={{fontSize:14,fontFamily:D,color:tx,display:"block",marginBottom:12}}>Sentiment Breakdown</span>
              {[{l:"Positive",c:reviews.filter(r=>r.sentiment==="positive").length,cl:"#047857",bg:"#ECFDF5"},{l:"Neutral",c:reviews.filter(r=>r.sentiment==="neutral").length,cl:"#A16207",bg:"#FFFBEB"},{l:"Negative",c:reviews.filter(r=>r.sentiment==="negative").length,cl:"#B91C1C",bg:"#FEF2F2"}].map((x,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <span style={{fontSize:11,color:x.cl,fontWeight:600,width:60}}>{x.l}</span>
                  <div style={{flex:1,height:8,background:"#EFECEA",borderRadius:4,overflow:"hidden"}}>
                    <div style={{width:`${(x.c/reviews.length)*100}%`,height:"100%",background:x.cl,borderRadius:4,transition:"width 0.5s"}}/>
                  </div>
                  <span style={{fontSize:12,fontFamily:D,color:tx,width:20,textAlign:"right"}}>{x.c}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{background:cd,border:`1px solid ${bd}`,borderRadius:12,padding:16}}>
            <span style={{fontSize:14,fontFamily:D,color:tx}}>Recent Activity</span>
            {reviews.filter(r=>r.reply).slice(0,4).map((r,i)=>(
              <div key={r.id} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:i<3?`1px solid ${bd}`:"none"}}>
                <PI p={r.plat}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}><span style={{fontSize:11,fontWeight:600}}>{r.author}</span><Stars c={r.rating} s={10}/><Pill t={r.status}>{r.status==="auto_replied"?"Replied":"Sent"}</Pill></div>
                  <p style={{fontSize:10,color:sb,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.reply}</p>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* REVIEWS */}
        {tab==="reviews"&&<>
          <h1 style={{fontSize:26,fontWeight:400,color:tx,margin:"0 0 16px",fontFamily:D}}>Review Manager</h1>
          <div style={{display:"flex",gap:6,marginBottom:14}}>
            {[{id:"all",l:"All"},{id:"needs",l:"Needs Action"},{id:"auto_replied",l:"Replied"},{id:"recovery",l:"Recovery"}].map(f=><button key={f.id} onClick={()=>setFilt(f.id)} style={{background:filt===f.id?"#EFECEA":cd,border:`1px solid ${filt===f.id?"#C5C0B8":bd}`,color:filt===f.id?tx:sb,padding:"5px 13px",borderRadius:7,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:F}}>{f.l}</button>)}
          </div>
          <div style={{display:"flex",gap:16}}>
            <div style={{flex:1}}>
              {list.map(r=>{const tone=TM[r.sentiment];return(
                <div key={r.id} onClick={()=>{setSel(r);setAi("");setEd("");setMT("public")}} style={{background:sel?.id===r.id?"#F3F1EC":cd,border:`1px solid ${sel?.id===r.id?"#C5C0B8":bd}`,borderRadius:12,padding:14,marginBottom:6,cursor:"pointer",transition:"all 0.15s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5,flexWrap:"wrap"}}>
                    <PI p={r.plat}/><span style={{fontSize:11,fontWeight:700}}>{r.author}</span><Stars c={r.rating} s={11}/>
                    <span style={{background:`${tone.c}10`,color:tone.c,fontSize:8,padding:"2px 7px",borderRadius:4,fontWeight:600}}>{tone.e} {tone.l}</span>
                    <Pill t={r.status}>{r.status==="auto_replied"?"✓ Replied":r.status==="recovery"?"🛡️ Recovery":r.status==="review_requested"?"📩 Sent":"⏳ Pending"}</Pill>
                    <span style={{marginLeft:"auto",fontSize:9,color:"#B5B0A6"}}>{r.date}</span>
                  </div>
                  <p style={{fontSize:11,color:"#5C5950",margin:0,lineHeight:1.6}}>{r.text}</p>
                  {r.reply&&<div style={{marginTop:8,padding:"8px 10px",background:"#F5FAF7",borderLeft:`2px solid ${ac}`,borderRadius:"0 6px 6px 0"}}>
                    <div style={{fontSize:8,color:ac,fontWeight:700,marginBottom:2}}>PUBLIC REPLY • {r.at}</div>
                    <p style={{fontSize:10,color:"#5C5950",margin:0,lineHeight:1.5}}>{r.reply}</p>
                  </div>}
                  {r.priv&&<div style={{marginTop:4,padding:"8px 10px",background:"#EEF2FF",borderLeft:"2px solid #4338CA",borderRadius:"0 6px 6px 0"}}>
                    <div style={{fontSize:8,color:"#4338CA",fontWeight:700,marginBottom:2}}>PRIVATE MESSAGE</div>
                    <p style={{fontSize:10,color:"#5C5950",margin:0,lineHeight:1.5}}>{r.priv.slice(0,90)}...</p>
                  </div>}
                </div>
              )})}
            </div>
            {sel&&(sel.status==="pending"||sel.status==="recovery")&&(
              <div style={{width:340,flexShrink:0,background:cd,border:`1px solid ${bd}`,borderRadius:14,padding:16,position:"sticky",top:0,maxHeight:"80vh",overflow:"auto"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
                  <div style={{fontSize:15,fontFamily:D,color:tx}}>AI Response Engine</div>
                  <span style={{fontSize:8,background:"#ECFDF5",color:ac,padding:"2px 8px",borderRadius:10,fontWeight:700}}>POWERED BY CLAUDE</span>
                </div>
                <div style={{background:"#F3F1EC",borderRadius:8,padding:10,marginBottom:10}}>
                  <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}><span style={{fontSize:10,fontWeight:600}}>{sel.author}</span><Stars c={sel.rating} s={10}/></div>
                  <p style={{fontSize:10,color:sb,margin:0,lineHeight:1.5}}>{sel.text}</p>
                </div>
                {sel.sentiment==="negative"&&<div style={{display:"flex",gap:4,marginBottom:10}}>
                  <button onClick={()=>setMT("public")} style={{flex:1,background:msgT==="public"?ac:"#EFECEA",color:msgT==="public"?"#fff":sb,border:"none",padding:"7px",borderRadius:7,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:F}}>💬 Public</button>
                  <button onClick={()=>setMT("private")} style={{flex:1,background:msgT==="private"?"#4338CA":"#EFECEA",color:msgT==="private"?"#fff":sb,border:"none",padding:"7px",borderRadius:7,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:F}}>📧 Private</button>
                </div>}
                {!ai&&!aiLoading&&<button onClick={()=>generateAIReply(sel,msgT)} style={{width:"100%",background:ac,border:"none",color:"#fff",padding:"10px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:F}}>⚡ Generate AI Reply</button>}
                {(ai||aiLoading)&&<>
                  <div style={{fontSize:8,color:aiLoading?ac:sb,fontWeight:700,marginBottom:4,display:"flex",alignItems:"center",gap:6}}>
                    {aiLoading?<><span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:ac,animation:"pulse 1s infinite"}}/>GENERATING WITH CLAUDE...</>:"✓ READY — EDIT BELOW"}
                  </div>
                  <textarea value={aiLoading?ai:ed} onChange={e=>setEd(e.target.value)} disabled={aiLoading} style={{width:"100%",minHeight:110,background:"#F9F8F6",border:`1px solid ${bd}`,borderRadius:8,padding:10,color:tx,fontSize:11,lineHeight:1.6,fontFamily:F,boxSizing:"border-box",resize:"vertical"}}/>
                  {!aiLoading&&<div style={{display:"flex",gap:6,marginTop:8}}>
                    <button onClick={approve} style={{flex:1,background:ac,border:"none",color:"#fff",padding:"9px",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:F}}>✓ Publish</button>
                    <button onClick={()=>generateAIReply(sel,msgT)} style={{background:"#EFECEA",border:`1px solid ${bd}`,color:sb,padding:"9px 12px",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:F}}>↻ Regen</button>
                  </div>}
                </>}
              </div>
            )}
          </div>
        </>}

        {/* RECOVERY */}
        {tab==="recovery"&&<>
          <h1 style={{fontSize:26,fontWeight:400,color:tx,margin:"0 0 20px",fontFamily:D}}>Negative Review Recovery</h1>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
            {[{s:"alert_sent",l:"Alert Sent",i:"🚨",c:"#B91C1C"},{s:"response_ready",l:"Ready",i:"📝",c:"#D97706"},{s:"owner_reviewing",l:"Reviewing",i:"👁️",c:"#2563EB"}].map(x=>(
              <div key={x.s} style={{background:cd,border:`1px solid ${bd}`,borderRadius:12,padding:16,textAlign:"center"}}>
                <div style={{fontSize:24}}>{x.i}</div>
                <div style={{fontSize:20,fontFamily:D,color:tx}}>{reviews.filter(r=>r.stage===x.s).length}</div>
                <div style={{fontSize:11,fontWeight:700,color:x.c}}>{x.l}</div>
              </div>
            ))}
          </div>
          {reviews.filter(r=>r.status==="recovery").map(r=>(
            <div key={r.id} style={{background:cd,border:"1px solid #FECACA",borderRadius:14,padding:18,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><PI p={r.plat}/><span style={{fontSize:12,fontWeight:700}}>{r.author}</span><Stars c={r.rating} s={11}/></div>
                  <p style={{fontSize:11,color:"#5C5950",margin:0,lineHeight:1.6,maxWidth:440}}>{r.text}</p>
                </div>
                <div style={{display:"flex",gap:6,height:"fit-content"}}>
                  <button onClick={()=>generateAIReply(r,"public").then(()=>{setTab("reviews")})} style={{background:ac,border:"none",color:"#fff",padding:"6px 12px",borderRadius:7,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:F}}>⚡ AI Reply</button>
                  <button onClick={()=>{setSel(r);setTab("reviews");setAi("");setEd("")}} style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#B91C1C",padding:"6px 12px",borderRadius:7,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:F}}>Respond →</button>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                <div style={{background:"#F5FAF7",border:"1px solid #A7F3D0",borderRadius:8,padding:10}}>
                  <div style={{fontSize:8,color:ac,fontWeight:700,marginBottom:3}}>💬 PUBLIC REPLY</div>
                  <div style={{fontSize:10,color:"#5C5950"}}>AI-powered empathetic public response ready</div>
                </div>
                <div style={{background:"#F6F5FF",border:"1px solid #C7D2FE",borderRadius:8,padding:10}}>
                  <div style={{fontSize:8,color:"#4338CA",fontWeight:700,marginBottom:3}}>📧 PRIVATE MESSAGE</div>
                  <div style={{fontSize:10,color:"#5C5950"}}>{r.priv?r.priv.slice(0,70)+"...":"Resolution message ready"}</div>
                </div>
              </div>
              <div style={{background:"#FAFAF7",border:`1px solid ${bd}`,borderRadius:8,padding:12}}>
                <div style={{fontSize:8,color:"#D97706",fontWeight:700,letterSpacing:1,marginBottom:8}}>SUGGESTED ACTIONS</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {(ACTIONS[r.stage]||[]).map((a,j)=>(
                    <div key={j} onClick={()=>flash(`Action "${a.t}" logged`)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",borderRadius:6,background:a.p==="high"?"#FEF2F2":cd,border:`1px solid ${a.p==="high"?"#FECACA":bd}`,cursor:"pointer",transition:"opacity 0.15s"}}>
                      <span style={{fontSize:13}}>{a.i}</span>
                      <div><div style={{fontSize:10,color:tx}}>{a.t}</div><div style={{fontSize:7,fontWeight:700,color:a.p==="high"?"#B91C1C":a.p==="med"?"#D97706":sb,textTransform:"uppercase"}}>{a.p}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {reviews.filter(r=>r.status==="recovery").length===0&&<div style={{textAlign:"center",padding:40,color:sb}}>
            <div style={{fontSize:40,marginBottom:8}}>🎉</div>
            <div style={{fontSize:14,fontFamily:D}}>No negative reviews in recovery.</div>
            <div style={{fontSize:12,marginTop:4}}>R.A.S. is keeping your reputation clean.</div>
          </div>}
        </>}

        {/* PROFILE SCORE */}
        {tab==="profile"&&<>
          <h1 style={{fontSize:26,fontWeight:400,color:tx,margin:"0 0 20px",fontFamily:D}}>Google Profile Health Score</h1>
          {(()=>{
            const checks=[
              {cat:"Foundation",items:[
                {name:"Business name matches signage",done:!!bizName,pts:10},
                {name:"Address verified and accurate",done:!!bizAddr,pts:10},
                {name:"Phone number listed",done:!!bizPhone,pts:5},
                {name:"Website URL linked",done:!!bizWebsite,pts:5},
                {name:"Business hours set",done:true,pts:5},
                {name:"Special/holiday hours set",done:false,pts:3},
              ]},
              {cat:"Categories & Services",items:[
                {name:"Primary category selected correctly",done:true,pts:10},
                {name:"3+ secondary categories added",done:true,pts:5},
                {name:"All services listed with descriptions",done:false,pts:7},
                {name:"Business description written (750 chars)",done:true,pts:5},
              ]},
              {cat:"Visual Content",items:[
                {name:"Logo uploaded",done:true,pts:3},
                {name:"Cover photo set",done:true,pts:3},
                {name:"15+ total photos uploaded",done:false,pts:5},
                {name:"Photos uploaded in last 7 days",done:false,pts:5},
                {name:"Video uploaded",done:false,pts:3},
              ]},
              {cat:"Reviews & Engagement",items:[
                {name:"Average rating above 4.0",done:parseFloat(s.avg)>=4.0,pts:5},
                {name:"10+ total reviews",done:reviews.length>=10,pts:5},
                {name:"Review received in last 30 days",done:true,pts:5},
                {name:"100% review response rate",done:s.rate>=100,pts:7},
              ]},
              {cat:"Content & Activity",items:[
                {name:"Google Post in last 7 days",done:false,pts:5},
                {name:"Q&A section has 5+ seeded questions",done:false,pts:4},
                {name:"Messaging enabled",done:false,pts:3},
                {name:"Appointment/booking link set",done:false,pts:3},
              ]},
            ];
            const totalPts=checks.reduce((a,c)=>a+c.items.reduce((b,i)=>b+i.pts,0),0);
            const earnedPts=checks.reduce((a,c)=>a+c.items.filter(i=>i.done).reduce((b,i)=>b+i.pts,0),0);
            const score=Math.round((earnedPts/totalPts)*100);
            const scoreColor=score>=80?ac:score>=60?"#D97706":"#B91C1C";
            return <>
              <div style={{display:"flex",gap:20,marginBottom:24}}>
                <div style={{width:200,background:cd,border:`1px solid ${bd}`,borderRadius:14,padding:24,textAlign:"center"}}>
                  <div style={{fontSize:48,fontWeight:400,color:scoreColor,fontFamily:D,lineHeight:1}}>{score}</div>
                  <div style={{fontSize:11,color:sb,marginTop:4}}>out of 100</div>
                  <div style={{background:"#E5E2DC",borderRadius:4,height:8,marginTop:12,overflow:"hidden"}}>
                    <div style={{width:`${score}%`,height:"100%",background:scoreColor,borderRadius:4,transition:"width 1s"}}/>
                  </div>
                  <div style={{fontSize:10,color:scoreColor,fontWeight:600,marginTop:8}}>{score>=80?"Excellent":score>=60?"Good — Room to Improve":score>=40?"Needs Work":"Critical — Fix Now"}</div>
                </div>
                <div style={{flex:1,background:cd,border:`1px solid ${bd}`,borderRadius:14,padding:20}}>
                  <div style={{fontSize:14,fontFamily:D,color:tx,marginBottom:10}}>What This Score Means</div>
                  <div style={{fontSize:12,color:"#5C5950",lineHeight:1.7}}>
                    Your Google Business Profile is <b>{score}% optimized</b>. Google uses your profile completeness, activity, and engagement to decide where you rank on Google Maps. The top 3 listings get 60% of all clicks. Every unchecked item below is costing you visibility and customers.
                  </div>
                  <div style={{marginTop:12,padding:10,background:"#F5FAF7",borderRadius:8,fontSize:11,color:ac,fontWeight:600}}>
                    Fixing all red items could improve your local ranking by 15-30%.
                  </div>
                </div>
              </div>
              {checks.map((cat,ci)=>{
                const catDone=cat.items.filter(i=>i.done).length;
                return <div key={ci} style={{background:cd,border:`1px solid ${bd}`,borderRadius:14,padding:18,marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <span style={{fontSize:13,fontWeight:700,color:tx}}>{cat.cat}</span>
                    <span style={{fontSize:11,color:catDone===cat.items.length?ac:"#D97706",fontWeight:600}}>{catDone}/{cat.items.length} complete</span>
                  </div>
                  {cat.items.map((item,ii)=>(
                    <div key={ii} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:ii<cat.items.length-1?`1px solid ${bd}`:"none"}}>
                      <div style={{width:22,height:22,borderRadius:6,background:item.done?"#ECFDF5":"#FEF2F2",border:`1px solid ${item.done?"#A7F3D0":"#FECACA"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>
                        {item.done?"✓":"✗"}
                      </div>
                      <span style={{fontSize:12,color:item.done?"#5C5950":"#B91C1C",flex:1,fontWeight:item.done?400:600}}>{item.name}</span>
                      <span style={{fontSize:10,color:sb,flexShrink:0}}>+{item.pts} pts</span>
                      {!item.done&&<button onClick={()=>flash("Action logged — complete this in your Google Business Profile")} style={{background:"#FEF2F2",border:"1px solid #FECACA",color:"#B91C1C",padding:"3px 10px",borderRadius:6,fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:F,flexShrink:0}}>Fix This</button>}
                    </div>
                  ))}
                </div>
              })}
            </>
          })()}
        </>}

        {/* ROI & COMPETITOR INTEL */}
        {tab==="roi"&&<>
          <h1 style={{fontSize:26,fontWeight:400,color:tx,margin:"0 0 20px",fontFamily:D}}>ROI & Competitor Intelligence</h1>
          <div style={{background:cd,border:`1px solid ${bd}`,borderRadius:14,padding:22,marginBottom:16}}>
            <div style={{fontSize:8,color:ac,fontWeight:700,letterSpacing:2,marginBottom:10}}>REVENUE IMPACT CALCULATOR</div>
            <div style={{fontSize:13,fontFamily:D,color:tx,marginBottom:14}}>Based on Harvard Business School research: 1 star = 5-9% revenue increase</div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:sb,fontWeight:600,marginBottom:4}}>Your monthly revenue (estimate)</div>
              <div style={{display:"flex",gap:6}}>
                {[15000,30000,50000,75000,100000].map(v=>(
                  <button key={v} onClick={()=>setMR(v)} style={{background:monthlyRev===v?ac:"#EFECEA",color:monthlyRev===v?"#fff":sb,border:"none",padding:"6px 12px",borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:F}}>${(v/1000)}K</button>
                ))}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
              {[{l:"YOUR RATING GAIN",v:`+${gain}`,s:"stars since joining"},{l:"ESTIMATED MONTHLY IMPACT",v:`$${revImpactLow.toLocaleString()}`,s:`to $${revImpactHigh.toLocaleString()}/mo extra`},{l:"ANNUAL IMPACT",v:`$${(revImpactLow*12).toLocaleString()}`,s:`to $${(revImpactHigh*12).toLocaleString()}/yr`}].map((x,i)=>(
                <div key={i} style={{background:"#ECFDF5",borderRadius:10,padding:16,textAlign:"center"}}>
                  <div style={{fontSize:8,color:ac,fontWeight:700,marginBottom:4}}>{x.l}</div>
                  <div style={{fontSize:28,fontFamily:D,color:ac}}>{x.v}</div>
                  <div style={{fontSize:9,color:sb}}>{x.s}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:14,padding:12,background:"#F5FAF7",borderRadius:8,textAlign:"center"}}>
              <span style={{fontSize:12,color:ac,fontWeight:700}}>You pay $99/mo → R.A.S. generates ${revImpactLow.toLocaleString()}-${revImpactHigh.toLocaleString()}/mo.</span>
              <span style={{fontSize:12,color:ac,fontWeight:600}}> That's a {Math.round(revImpactLow/99)}x-{Math.round(revImpactHigh/99)}x return.</span>
            </div>
          </div>

          <div style={{background:cd,border:`1px solid ${bd}`,borderRadius:14,padding:22}}>
            <div style={{fontSize:8,color:ac,fontWeight:700,letterSpacing:2,marginBottom:10}}>COMPETITOR INTELLIGENCE</div>
            <div style={{fontSize:13,fontFamily:D,color:tx,marginBottom:14}}>How you stack up against local competitors</div>
            {COMPETITORS.map((c,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:i<COMPETITORS.length-1?`1px solid ${bd}`:"none"}}>
                <div style={{width:28,height:28,borderRadius:6,background:i===0?ac:"#EFECEA",color:i===0?"#fff":sb,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700}}>{i+1}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:13,fontWeight:i===0?700:500,color:i===0?ac:tx}}>{i===0?(bizName||c.name):c.name}</span>
                    {i===0&&<span style={{background:"#ECFDF5",color:ac,fontSize:8,fontWeight:700,padding:"2px 8px",borderRadius:10}}>YOU</span>}
                  </div>
                  <div style={{fontSize:10,color:sb}}>{c.reviews} reviews</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><Stars c={Math.round(c.rating)} s={12}/><span style={{fontSize:16,fontFamily:D,fontWeight:400,color:i===0?ac:tx}}>{c.rating}</span></div>
                  <div style={{fontSize:10,color:parseFloat(c.trend)>0?ac:parseFloat(c.trend)<0?"#B91C1C":sb,fontWeight:600}}>{parseFloat(c.trend)>0?"+":""}{c.trend}</div>
                </div>
              </div>
            ))}
            <div style={{marginTop:14,padding:10,background:"#ECFDF5",borderRadius:8,textAlign:"center",fontSize:11,color:ac,fontWeight:600}}>
              You're #1 in your area. R.A.S. is keeping you ahead.
            </div>
          </div>
        </>}

        {/* GROWTH */}
        {tab==="growth"&&<>
          <h1 style={{fontSize:26,fontWeight:400,color:tx,margin:"0 0 20px",fontFamily:D}}>Review Growth Engine</h1>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
            {[{v:s.req,l:"Requests Sent",c:"#4338CA"},{v:reviews.filter(r=>r.rating>=4).length,l:"Happy Customers",c:ac},{v:s.avg,l:"Current Rating",c:"#D97706"}].map((x,i)=>(
              <div key={i} style={{background:cd,border:`1px solid ${bd}`,borderRadius:12,padding:16,textAlign:"center"}}>
                <div style={{fontSize:28,fontFamily:D,color:x.c}}>{x.v}</div>
                <div style={{fontSize:10,color:sb}}>{x.l}</div>
              </div>
            ))}
          </div>
          {reviews.filter(r=>r.rating>=4&&r.status!=="review_requested").map(r=>(
            <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,background:cd,border:`1px solid ${bd}`,borderRadius:10,padding:"10px 14px",marginBottom:5}}>
              <PI p={r.plat}/>
              <div style={{flex:1}}><span style={{fontSize:11,fontWeight:600}}>{r.author}</span><Stars c={r.rating} s={10}/><p style={{fontSize:10,color:sb,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:340}}>{r.text}</p></div>
              <button onClick={()=>{const updated=reviews.map(x=>x.id===r.id?{...x,status:"review_requested"}:r.id===x.id?x:x);setR(prev=>prev.map(x=>x.id===r.id?{...x,status:"review_requested"}:x));flash(`Review request sent to ${r.author}!`)}} style={{background:"#4338CA",border:"none",color:"#fff",padding:"6px 14px",borderRadius:7,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:F}}>🚀 Send</button>
            </div>
          ))}
        </>}

        {/* SETTINGS */}
        {tab==="settings"&&<>
          <h1 style={{fontSize:26,fontWeight:400,color:tx,margin:"0 0 20px",fontFamily:D}}>Settings</h1>
          <div style={{display:"flex",gap:6,marginBottom:20}}>
            {[{id:"business",l:"Business Info"},{id:"tone",l:"AI Tone"},{id:"platforms",l:"Platforms"},{id:"notifications",l:"Notifications"},{id:"billing",l:"Billing"}].map(t=>(
              <button key={t.id} onClick={()=>setSTB(t.id)} style={{background:settingsTab===t.id?"#EFECEA":cd,border:`1px solid ${settingsTab===t.id?"#C5C0B8":bd}`,color:settingsTab===t.id?tx:sb,padding:"6px 16px",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:F}}>{t.l}</button>
            ))}
          </div>

          {settingsTab==="business"&&<div style={{background:cd,border:`1px solid ${bd}`,borderRadius:14,padding:24,maxWidth:500}}>
            <Input label="BUSINESS NAME" value={bizName} onChange={setBN} placeholder="Your Business"/>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,fontWeight:600,color:sb,display:"block",marginBottom:5}}>BUSINESS TYPE</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {Object.entries(niches).map(([k,v])=>(
                  <button key={k} onClick={()=>{setBT(k);setN(k)}} style={{background:bizType===k?ac:"#EFECEA",color:bizType===k?"#fff":sb,border:"none",padding:"5px 12px",borderRadius:20,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:F}}>{v}</button>
                ))}
              </div>
            </div>
            <Input label="PHONE" value={bizPhone} onChange={setBP} placeholder="(555) 123-4567"/>
            <Input label="EMAIL" value={bizEmail} onChange={setBE} type="email" placeholder="hello@business.com"/>
            <Input label="ADDRESS" value={bizAddr} onChange={setBA} placeholder="123 Main St"/>
            <Input label="WEBSITE" value={bizWebsite} onChange={setBW} placeholder="https://..."/>
            <Btn onClick={async()=>{await saveSettings();flash("Settings saved!")}}>Save Changes</Btn>
          </div>}

          {settingsTab==="tone"&&<div style={{background:cd,border:`1px solid ${bd}`,borderRadius:14,padding:24,maxWidth:560}}>
            <div style={{fontSize:14,fontFamily:D,color:tx,marginBottom:12}}>AI Tone Training</div>
            <p style={{fontSize:12,color:sb,margin:"0 0 16px"}}>This controls how R.A.S. sounds when replying to your customers. Real AI (Claude) generates every reply.</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
              {tones.map(t=>(
                <div key={t.id} onClick={()=>setTS(t.id)} style={{padding:14,background:toneStyle===t.id?"#F5FAF7":cd,border:`1px solid ${toneStyle===t.id?"#A7F3D0":bd}`,borderRadius:10,cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:13,fontWeight:600,color:toneStyle===t.id?ac:tx}}>{t.l}</div>
                  <div style={{fontSize:10,color:sb,marginTop:2}}>{t.d}</div>
                </div>
              ))}
            </div>
            {toneStyle==="custom"&&<div style={{marginBottom:14}}>
              <label style={{fontSize:11,fontWeight:600,color:sb,display:"block",marginBottom:5}}>DESCRIBE YOUR VOICE</label>
              <textarea value={toneCustom} onChange={e=>setTC(e.target.value)} placeholder="How do you talk to your customers? What's your vibe?" style={{width:"100%",minHeight:80,border:`1px solid ${bd}`,borderRadius:8,padding:10,fontSize:12,fontFamily:F,color:tx,boxSizing:"border-box",resize:"vertical"}}/>
            </div>}
            <Btn onClick={async()=>{await saveSettings();flash("Tone updated!")}}>Save Tone</Btn>
          </div>}

          {settingsTab==="platforms"&&<div style={{background:cd,border:`1px solid ${bd}`,borderRadius:14,padding:24,maxWidth:500}}>
            <div style={{fontSize:14,fontFamily:D,color:tx,marginBottom:12}}>Connected Platforms</div>
            {[
              {id:"google",name:"Google Business Profile",icon:"G",color:"#4285F4"},
              {id:"yelp",name:"Yelp",icon:"Y",color:"#D32323"},
              {id:"facebook",name:"Facebook",icon:"f",color:"#1877F2"}
            ].map(p=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:14,border:`1px solid ${bd}`,borderRadius:10,marginBottom:6}}>
                <span style={{background:p.color,color:"#fff",fontSize:12,fontWeight:800,width:32,height:32,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>{p.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{p.name}</div>
                  <div style={{fontSize:10,color:platforms[p.id]?ac:sb}}>{platforms[p.id]?"✓ Enabled":"Not connected"}</div>
                </div>
                <button onClick={()=>{setPlatforms(prev=>({...prev,[p.id]:!prev[p.id]}));saveSettings()}} style={{background:platforms[p.id]?"#EFECEA":ac,color:platforms[p.id]?sb:"#fff",border:"none",padding:"6px 14px",borderRadius:7,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:F}}>{platforms[p.id]?"Disconnect":"Connect"}</button>
              </div>
            ))}
          </div>}

          {settingsTab==="notifications"&&<div style={{background:cd,border:`1px solid ${bd}`,borderRadius:14,padding:24,maxWidth:500}}>
            <div style={{fontSize:14,fontFamily:D,color:tx,marginBottom:12}}>Notification Preferences</div>
            {[
              {l:"Negative review alerts",d:"Get notified immediately when a 1-2 star review comes in",on:true},
              {l:"Daily summary email",d:"Morning digest of all reviews and actions",on:true},
              {l:"Weekly report",d:"Performance analytics sent every Monday",on:false},
              {l:"SMS alerts for critical reviews",d:"Text message for 1-star reviews only",on:false},
              {l:"Recovery status updates",d:"Get notified when a recovery action is completed",on:true},
            ].map((n,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:i<4?`1px solid ${bd}`:"none"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:tx}}>{n.l}</div>
                  <div style={{fontSize:10,color:sb}}>{n.d}</div>
                </div>
                <div onClick={()=>flash("Notification preference updated")} style={{width:40,height:22,borderRadius:11,background:n.on?ac:"#DBD8D2",cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
                  <div style={{width:18,height:18,borderRadius:9,background:"#fff",position:"absolute",top:2,left:n.on?20:2,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.15)"}}/>
                </div>
              </div>
            ))}
          </div>}

          {settingsTab==="billing"&&<div style={{maxWidth:500}}>
            <div style={{background:cd,border:`1px solid ${bd}`,borderRadius:14,padding:24,marginBottom:12}}>
              <div style={{fontSize:14,fontFamily:D,color:tx,marginBottom:4}}>Current Plan</div>
              <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:6}}>
                <span style={{fontSize:28,fontFamily:D,color:ac}}>{currentPlan.charAt(0).toUpperCase()+currentPlan.slice(1)}</span>
                <span style={{fontSize:13,color:sb}}>${PLANS.find(p=>p.n.toLowerCase()===currentPlan)?.pr||0}/month</span>
              </div>
              {subInfo&&subInfo.status==="trialing"&&<div style={{padding:8,background:"#EEF2FF",border:"1px solid #C7D2FE",borderRadius:8,marginBottom:10,fontSize:11,color:"#4338CA",fontWeight:600}}>
                🎉 Free trial active — ends {new Date(subInfo.trialEnd*1000).toLocaleDateString()}
              </div>}
              {subInfo&&subInfo.cancelAtPeriodEnd&&<div style={{padding:8,background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:8,marginBottom:10,fontSize:11,color:"#A16207",fontWeight:600}}>
                ⚠️ Cancelling at end of billing period — {new Date(subInfo.currentPeriodEnd*1000).toLocaleDateString()}
              </div>}
              <div style={{padding:14,background:"#F5FAF7",border:"1px solid #A7F3D0",borderRadius:10,marginBottom:16}}>
                <div style={{fontSize:11,color:ac,fontWeight:600}}>Your plan includes:</div>
                <div style={{fontSize:11,color:"#5C5950",marginTop:4,lineHeight:1.8}}>
                  {PLANS.find(p=>p.n.toLowerCase()===currentPlan)?.feat.join(" • ")||"All features"}
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {PLANS.filter(p=>p.n.toLowerCase()!==currentPlan).map(p=>(
                  <button key={p.n} onClick={()=>setSC(p)} style={{flex:1,background:"#EFECEA",border:`1px solid ${bd}`,color:tx,padding:"8px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:F,minWidth:140}}>
                    {p.pr>(PLANS.find(x=>x.n.toLowerCase()===currentPlan)?.pr||0)?"Upgrade":"Switch"} to {p.n} (${p.pr}/mo)
                  </button>
                ))}
              </div>
            </div>
            <div style={{background:cd,border:`1px solid ${bd}`,borderRadius:14,padding:24}}>
              <div style={{fontSize:14,fontFamily:D,color:tx,marginBottom:12}}>Payment & Billing</div>
              {isNetlify?<>
                <button onClick={openBillingPortal} style={{width:"100%",background:ac,color:"#fff",border:"none",padding:"11px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:F,marginBottom:10}}>
                  Open Stripe Billing Portal →
                </button>
                <div style={{fontSize:10,color:sb,textAlign:"center"}}>Manage your card, view invoices, and cancel anytime via Stripe's secure portal.</div>
              </>:<div style={{padding:14,background:"#ECFDF5",border:"1px solid #A7F3D0",borderRadius:10,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:20}}>💳</span>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:tx}}>Stripe Test Mode Active</div>
                  <div style={{fontSize:10,color:ac}}>Use card 4242 4242 4242 4242 with any future date and CVC</div>
                </div>
              </div>}
            </div>
          </div>}
        </>}

        {/* PRICING */}
        {tab==="pricing"&&<>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontSize:8,color:ac,fontWeight:700,letterSpacing:2.5,marginBottom:6}}>R.A.S. FOR {niches[niche]?.toUpperCase()||"BUSINESSES"}</div>
            <h1 style={{fontSize:30,fontWeight:400,color:tx,margin:0,fontFamily:D}}>Simple pricing. Serious results.</h1>
            <p style={{fontSize:12,color:sb,margin:"6px 0 0"}}>14-day free trial. Cancel anytime.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,maxWidth:820,margin:"0 auto"}}>
            {PLANS.map(p=>{
              const isActive=currentPlan===p.n.toLowerCase();
              return(
              <div key={p.n} style={{background:cd,border:`1px solid ${isActive?ac:p.pop?ac:bd}`,borderRadius:16,padding:22,position:"relative",transform:p.pop?"scale(1.03)":"none",boxShadow:p.pop?"0 8px 30px rgba(26,92,58,0.06)":"none"}}>
                {p.pop&&!isActive&&<div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:ac,color:"#fff",fontSize:9,fontWeight:800,padding:"3px 14px",borderRadius:20,letterSpacing:1}}>MOST POPULAR</div>}
                {isActive&&<div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:"#D97706",color:"#fff",fontSize:9,fontWeight:800,padding:"3px 14px",borderRadius:20,letterSpacing:1}}>CURRENT PLAN</div>}
                <div style={{fontSize:12,fontWeight:700,color:p.pop?ac:sb,marginBottom:4}}>{p.n}</div>
                <div style={{display:"flex",alignItems:"baseline",gap:2,marginBottom:2}}><span style={{fontSize:38,fontFamily:D,color:tx,lineHeight:1}}>${p.pr}</span><span style={{fontSize:12,color:sb}}>/mo</span></div>
                <div style={{fontSize:10,color:sb,marginBottom:16}}>{p.d}</div>
                <button onClick={()=>{if(isActive){flash("You're already on this plan!")}else{setSC(p)}}} style={{width:"100%",padding:"10px",background:isActive?"#D97706":p.pop?ac:"#EFECEA",border:isActive||p.pop?"none":`1px solid ${bd}`,color:isActive||p.pop?"#fff":tx,borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:F,marginBottom:14}}>
                  {isActive?"Current Plan":stripeLoaded?"Subscribe Now":"Start Free Trial"}
                </button>
                <div style={{borderTop:`1px solid ${bd}`,paddingTop:12}}>
                  {p.feat.map((f,j)=><div key={j} style={{display:"flex",gap:6,alignItems:"flex-start",marginBottom:6}}><span style={{color:ac,fontSize:11,flexShrink:0}}>✓</span><span style={{fontSize:11,color:"#5C5950",lineHeight:1.4}}>{f}</span></div>)}
                </div>
              </div>
            )})}
          </div>
          {stripeLoaded&&<div style={{textAlign:"center",marginTop:16,fontSize:10,color:sb}}>
            🔒 Payments secured by Stripe • Test mode: use card <span style={{fontFamily:"monospace",background:"#EFECEA",padding:"1px 6px",borderRadius:4}}>4242 4242 4242 4242</span>
          </div>}
        </>}
      </main>

      {/* STRIPE CHECKOUT MODAL */}
      {showCheckout&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}} onClick={e=>{if(e.target===e.currentTarget&&!processing)setSC(null)}}>
        <div style={{width:440,background:cd,borderRadius:20,padding:"32px 36px",boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div>
              <div style={{fontSize:20,fontFamily:D,color:tx}}>Subscribe to {showCheckout.n}</div>
              <div style={{fontSize:12,color:sb}}>Secure payment via Stripe</div>
            </div>
            <button onClick={()=>{if(!processing)setSC(null)}} style={{background:"none",border:"none",fontSize:20,color:sb,cursor:"pointer",padding:4}}>✕</button>
          </div>

          {/* Plan summary */}
          <div style={{background:"#ECFDF5",border:"1px solid #A7F3D0",borderRadius:10,padding:14,marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:ac}}>{showCheckout.n} Plan</div>
              <div style={{fontSize:10,color:sb}}>{showCheckout.d}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:24,fontFamily:D,color:ac}}>${showCheckout.pr}</div>
              <div style={{fontSize:10,color:sb}}>per month</div>
            </div>
          </div>

          {/* Card form */}
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,fontWeight:600,color:sb,display:"block",marginBottom:5}}>NAME ON CARD</label>
            <input type="text" value={cardName} onChange={e=>setCN(e.target.value)} placeholder="Full name" style={{width:"100%",padding:"10px 14px",border:`1px solid ${bd}`,borderRadius:8,fontSize:13,fontFamily:F,color:tx,background:cd,boxSizing:"border-box",outline:"none"}}/>
          </div>

          <div style={{marginBottom:20}}>
            <label style={{fontSize:11,fontWeight:600,color:sb,display:"block",marginBottom:5}}>CARD DETAILS</label>
            <div ref={cardRef} style={{border:`1px solid ${bd}`,borderRadius:8,padding:"12px 14px",background:cd,minHeight:24}}/>
            {!stripeLoaded&&<div style={{fontSize:10,color:sb,marginTop:4}}>Loading secure payment form...</div>}
          </div>

          {/* Test mode hint */}
          <div style={{padding:10,background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:8,marginBottom:16,fontSize:10,color:"#A16207"}}>
            🧪 <b>Test mode</b> — Use card <span style={{fontFamily:"monospace",background:"#FEF3C7",padding:"1px 4px",borderRadius:3}}>4242 4242 4242 4242</span> • Any future exp • Any CVC
          </div>

          <button onClick={handleCheckout} disabled={!cardComplete||processing||!stripeLoaded} style={{width:"100%",padding:"13px",background:cardComplete&&!processing?ac:"#C5C0B8",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:cardComplete&&!processing?"pointer":"not-allowed",fontFamily:F,opacity:processing?0.7:1}}>
            {processing?"Processing...":cardComplete?`Subscribe — $${showCheckout.pr}/mo`:"Enter card details"}
          </button>

          <div style={{textAlign:"center",marginTop:10,fontSize:9,color:sb}}>
            🔒 Encrypted by Stripe. We never see your card details.
          </div>
        </div>
      </div>}

      {/* Toast */}
      {toast&&<div style={{position:"fixed",bottom:24,right:24,background:ac,color:"#fff",padding:"11px 22px",borderRadius:10,fontSize:12,fontWeight:700,boxShadow:"0 6px 20px rgba(26,92,58,0.15)",zIndex:200,animation:"slideIn 0.3s ease"}}>✓ {toast}</div>}
      <style>{`
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#D5D0C8;border-radius:2px}
        textarea:focus,input:focus{outline:none;border-color:${ac}!important}
        button:hover{opacity:0.92}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes slideIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
      `}</style>
    </div>
  );
}

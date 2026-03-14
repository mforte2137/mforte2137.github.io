const recommendBtn = document.getElementById("recommendBtn")
const recommendation = document.getElementById("recommendation")
const sessionPlan = document.getElementById("sessionPlan")
const reportOutput = document.getElementById("reportOutput")

recommendBtn.addEventListener("click", generatePlan)

function generatePlan(){

let scores = {
expert:0,
explorer:0,
guided:0,
rollout:0,
momentum:0
}

const q1=document.getElementById("q1").value
const q2=document.getElementById("q2").value
const q3=document.getElementById("q3").value
const q4=document.getElementById("q4").value
const q5=document.getElementById("q5").value
const q6=document.getElementById("q6").value

if(q1==="several") scores.expert+=2
if(q1==="one") scores.explorer+=1
if(q1==="new") scores.guided+=2

if(q2==="experiment") scores.explorer+=2
if(q2==="structured") scores.guided+=2
if(q2==="mix") scores.expert+=1

if(q3==="few") scores.expert+=1
if(q3==="small") scores.explorer+=1
if(q3==="departments") scores.guided+=2

if(q4==="asap") scores.explorer+=2
if(q4==="weeks") scores.expert+=1
if(q4==="norush") scores.guided+=1

if(q5==="sales") scores.rollout+=2
if(q5==="speed") scores.explorer+=1
if(q5==="sync") scores.expert+=1

if(q6==="yes") scores.rollout+=1

if(q4==="norush" && q3==="small"){
scores.momentum+=2
}

let type=Object.keys(scores).reduce((a,b)=>scores[a]>scores[b]?a:b)

let typeName={
expert:"Targeted Expert",
explorer:"Fast-Track Explorer",
guided:"Guided Team",
rollout:"Admin → Sales Rollout",
momentum:"Momentum Risk"
}

recommendation.innerHTML=`<h3>${typeName[type]}</h3>`

let sessions=[]

sessions.push("Session 1 – Kickoff + First Quote + Roadmap")

if(type==="explorer"){
sessions.push("Session 2 – Catalog & Quoting Workflow")
sessions.push("Session 3 – Templates & Quote Presentation")
}

if(type==="expert"){
sessions.push("Session 2 – Integrations & Catalog Strategy")
sessions.push("Session 3 – Templates & Workflow")
}

if(type==="guided"){
sessions.push("Session 2 – Catalog & Pricing")
sessions.push("Session 3 – Templates & Email Experience")
sessions.push("Session 4 – Integrations & Workflow")
}

if(type==="rollout"){
sessions.push("Session 2 – Catalog & Configuration")
sessions.push("Session 3 – Templates & Quote Experience")
sessions.push("Session 4 – Integrations")
sessions.push("Session 5 – Sales Team Training")
}

if(type==="momentum"){
sessions.push("Session 2 – Quick Quote Workflow")
sessions.push("Session 3 – Templates & Essentials")
}

sessionPlan.innerHTML=""

sessions.forEach(s=>{
sessionPlan.innerHTML+=`<div class="session-card">${s}</div>`
})

generateReport(typeName[type],sessions)

}

function generateReport(type,sessions){

const msp=document.getElementById("mspName").value
const golive=document.getElementById("goLiveDate").value

let report=`MSP: ${msp}
Go-Live Date: ${golive}

Recommended Onboarding Type: ${type}

Session Plan:
`

sessions.forEach(s=>{
report+=`- ${s}
`
})

reportOutput.value=report

}

document.getElementById("copyReport").addEventListener("click",()=>{
reportOutput.select()
document.execCommand("copy")
})

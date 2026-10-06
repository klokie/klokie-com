---
title: "CV — Daniel Grossfeld"
slug: "cv"
description: "CV för Daniel “Klokie” Grossfeld — senior fullstack-utvecklare och systemarkitekt i Stockholm. TypeScript, Node, React, event-drivna tjänster, moln."
draft: false
---

# Daniel "Klokie" Grossfeld

Senior fullstack-utvecklare, systemarkitekt och entreprenör — Stockholm.

27 år av att bygga för webben: komplexa datadrivna produkter, e-handel,
mediedistribution och reglerad healthtech. Grundare och delägare i fyra
internationella bolag, och hela vägen hands-on som utvecklare — jag har lett
små, snabba team i New York, London, Paris, Barcelona och Stockholm, och jag
skriver fortfarande koden själv.

På senare tid handlar det om två saker. **Jag bygger _med_ AI-agenter, inte bara
anropar dem** — MCP-servrar, alltid-på-infrastruktur, versionerade skills och
arbetsflöden — och jag införde det arbetssättet i ett utvecklingsteam, där
lärdomen var att det håller först när gemensamma regler och dokumentation finns.
Och **jag bygger gränssnitten som gör stora, strukturerade datamängder
begripliga**: ett grafbibliotek i Visx för medicinska data över tid, och
dessförinnan en layoutmotor som komponerade magasinsuppslag automatiskt med
datorseende.

Under båda: TypeScript och Node, React och React Native, Python, event-drivna
tjänster på Kafka och Postgres — plus hantverket runt omkring, det som får en
plattform att överleva sin egen historia. Jag gillar att äga en tjänst hela
vägen, och att lämna ett team snabbare än jag hittade det.

**Öppen för roller på senior-, lead- eller staff-nivå** — remote-first eller
genuint flexibel hybrid, södra Stockholm eller helt remote.
[Hör av dig](/sv/contact/).

## Erfarenhet

### Werlabs — Fullstack-utvecklare

_Stockholm, 2024 → nu (först som konsult, anställd sedan februari 2025)_

Healthtech-plattform för blodprovtagning till privatpersoner, i en reglerad
svensk miljö.

- Byggde och ägde två tjänster i produktion hela vägen: en boknings- och
  appointments-tjänst integrerad mot en extern schemaläggningsleverantör —
  entitlements, hantering av vårdgivare, webhooks, Kafka-events, bokning och
  avbokning — som ligger till grund för bolagets betalda videosamtal; samt en
  PDF-genereringstjänst i TypeScript/Playwright som ersatte en skör
  JVM-baserad legacy-lösning, med service-to-service-autentisering,
  browser-isolering, övervakning och en väg till autoskalning.
- Levererade infrastrukturen runt omkring: webhook-konsumenter, health
  checks, strukturerad loggning, feature toggles och proportionell utrullning.
- Bar kontinuiteten i legacy-plattformen genom flera avhopp — identitet och
  användarprofil, provsvar, vårdgivarappen — inklusive en överlämning till
  extern partner.
- Byggde ett dynamiskt grafbibliotek ovanpå Airbnb:s Visx som visualiserar
  medicinska data över tid, använt både mot konsument och B2B — stora
  datamängder, interaktiva tidsserier och ett komponent-API som andra utvecklare
  bygger vidare på.
- Introducerade AI-stött utvecklingsarbete i teamet (editorverktyg,
  gemensamma regler, återanvändbara skills) och onboardade en ny utvecklare
  genom kodgranskning och kontextöverföring.

### Scania — Elain Advanced — Product Owner / Senior backend

_Stockholm, 2023–2024_ — dataplattform för en global lastbilstillverkare.
Serverlösa ingest-API:er i **Python**, SQL-migrering och modellering på GCP och
AWS, med ansvar för både backlog och backend.

### TV4 / Telia / C More — Senior fullstackutvecklare

_Stockholm, 2022–2023_ — streaming och mediedistribution i nationell skala, på
webb och connected-TV. Redaktionella system och innehållsleverans under skarp
trafik, inklusive PIN-autentisering och hantering av samtycke över domäner.

### Sneakersnstuff — Senior fullstack / Tech lead

_Stockholm, 2020–2022_ — ledde ett litet team som byggde **React Native**-appen
(TypeScript, AWS, **Swift** för det nativa iOS-lagret) förbi **en miljon
månatliga användare**, flerspråkigt och över flera marknader, språk och valutor.
Migrerade en stor kodbas till TypeScript, integrerade betal- och logistik-API:er,
ägde releaser i App Store och Play, och byggde in ett Unity-spel i appen.

### Enliven — Medgrundare & CTO

_Stockholm, 2017–2024_ — AI-baserad medieplattform för professionella kreatörer
och personliga premiumvarumärken. Tog in 1 MSEK och byggde hela stacken själv —
Node.js på MongoDB och MySQL med Docker, ett REST-API, en React-frontend — och
produkten i sig: ett designsystem som komponerade magasinskvalitativa layouter
dynamiskt med **datorseende**, flera år före dagens AI-våg.

Min kompanjon och jag värvade personligen över **250 journalister, fotografer,
stylister och kockar** från ledande publikationer, som publicerade på
plattformen mellan 2017 och 2022. När konsumentprodukten stannade av
produktifierade jag layoutmotorn som ett fristående API.

### Odalisque Magazine — Medgrundare & teknisk chef

En av Sveriges ledande publikationer inom mode, konst och kultur, i print och
på webben.

### S2A Interactive — Grundare

Egen studio som byggde modern webbarkitektur åt små och medelstora bolag inom
media och mode i Europa och USA.

### Surface to Air — Medgrundare & CTO

_New York / Paris, 2000–2008_ — designstudio med kunder inom förlag, musik,
film och mode.

Tidigare kunder inkluderar MoMA, Tiffany & Co., Rawkus, Source och New York
Magazine. Den längre listan finns under
[saker jag har jobbat med](/sv/work/).

## Att bygga med agenter

Två år av att bygga _med_ AI-agenter, inte bara anropa dem:

- **Alltid-på-infrastruktur för agenter** på en egen Linux-maskin — schemalagda
  och händelsestyrda jobb, meddelande- och mailgateways, och en migrering mellan
  agent-runtimes med integrationerna intakta.
- **MCP-servrar och verktyg** för egen data och egna uppgiftssystem, plus
  repo- och tillståndshantering över tre maskiner —
  [repoman](https://github.com/klokie/repoman), skrivet i **Go**.
- **Agent-skills och arbetsflöden** som återanvändbara, versionerade enheter.
  Det var detta jag sedan införde i teamet på Werlabs, och lärdomen var att
  införandet håller först när gemensamma regler och dokumentation finns — det är
  det som gör agenternas output till något ett team accepterar i granskning.

## Forskning och sidoprojekt

**Promobilia / KTH** — _2025 → nu_ — hjälpmedelsteknik för döva och
hörselskadade: realtidsigenkänning av ljudmiljön med haptisk och visuell
återkoppling. **Unity** på iOS med Apple Watch-följeslagare, inferens på enheten
(YAMNet-embeddings plus en tränad klassificerare, exporterad till **ONNX**),
Core Haptics och ett eget WatchConnectivity-plugin. Medförfattare till ett
bidrag till ASSETS 2026.

**Kendra Foundation** — _London, 2009–2013_ — två EU-projekt inom FP7.
EU-kontakt för SARACEN, med förslag antagna av Europeiska kommissionen, och
P2P-Next — peer-to-peer-distribution och adaptiv streaming, 21 partners — som
senior backendutvecklare. Distribuerad maskininlärning på ett
**Hadoop/Mahout**-kluster med Python.

**Den här sajten** — Astro, TypeScript och Cloudflare Workers: helt tvåspråkig,
med routing per språk, översättningsfallback, canonical och hreflang,
språkmedveten strukturerad data, edge-leverans och en innehållspipeline som
publicerar från källan vid push.

## Stack

**Främst:** TypeScript, Node.js, React, **React Native**, **Python**, Astro,
Postgres, Kafka, REST och event-drivna API:er, Playwright, Docker, CI/CD.

**Moln och leverans:** AWS, GCP, Cloudflare Workers, CDN och edge-leverans,
observability och strukturerad loggning, feature flagging och stegvis
utrullning.

**AI och agenter:** LLM-agent-runtimes, MCP-serverdesign, agent-skills och
schemaläggning, retrieval över lokala korpusar, datorseende, inferens på enheten
(ONNX), distribuerad ML.

**Mobilt och realtid:** React Native, Swift, Unity (C#), Core Haptics.

**Även:** **Go**, Keycloak och OIDC, i18n-routing och innehållspipelines,
datavisualisering (Visx, D3).

## Utbildning

**Boston University** — _cum laude_, 1993–1998
B.S. Computer Systems Engineering · B.A. Music Theory and Composition

## Språk

Engelska (modersmål), svenska, spanska, grundläggande franska.

---

Fullständig historik på [LinkedIn](https://www.linkedin.com/in/klokie/) ·
[saker jag har jobbat med](/sv/work/) · [hör av dig](/sv/contact/)

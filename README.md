# GolfFun

Ett WordPress-plugin för ett svenskt golfspel, med **Nordisk klubb** och **Skog och sjö** som valbara teman. Adminpanelen har temaförhandsvisningar, ljudinställningar, information om spelet och kopiering av kortkoden.

## Installera på WordPress

1. Ladda upp `dist/golffun-1.0.0.zip` under **Tillägg → Lägg till nytt → Ladda upp tillägg** och aktivera.
2. Välj tema under **GolfFun** i admin och klicka på **Spara ändringar**.
3. Lägg `[golffun]` i ett kortkodsblock på en sida. Välj gärna full sidbredd i sidans temainställningar.

Det behövs inga API-nycklar, externa tjänster eller Node.js på WordPress-servern. Minimikrav: WordPress 6.5 och PHP 7.4. PHP 8.3 och WordPress 6.8.3 används i integrationstesterna. Spelet behöver en modern webbläsare med stöd för ES-moduler, Canvas och dialog-elementet. Web Audio används för valfritt ljud.

## Utveckling och tester

Arbeta i den befintliga utcheckningen. Varje molnuppgift är redan isolerad; skapa ingen extra Git-worktree.

```bash
cd /workspace/GolfFun
npm exec --cache /workspace/.npm-cache --yes --package=npm@11.16.0 -- npm ci --cache /workspace/.npm-cache --no-audit --no-fund
npm test
npm run dev
# I en annan terminal, när WordPress är redo:
npm run test:e2e
npm run package
```

Utvecklingsverktygen behöver Node.js 24.18 eller senare och npm 11.16 eller senare. Installationskommandot ovan använder rätt npm-version även om miljön har en äldre version globalt.

`npm run dev` förbereder en lokal testinstallation med WordPress 6.8.3 från WordPress officiella GitHub-repository och startar PHP 8.3 genom WordPress Playground. Pluginet monteras direkt, och en lokal spelsida och testinloggning skapas. PHP, MySQL och Docker behöver inte installeras. Testinloggningen hör enbart till den lokala testmiljön. Ingen befintlig webbplats kontaktas eller ändras.

Testservern lyssnar på port 9400. Playwright använder `/usr/bin/chromium`; ange `CHROMIUM_PATH` om Chromium finns på en annan plats. För `npm run dev` krävs nätåtkomst till `github.com` och `codeload.github.com`, och för `npm ci` även `registry.npmjs.org`. Standardporten 9400 måste vara ledig. Testdatabasen sparas under den ignorerade katalogen `.runtime/`. Utvecklingsservern återställer temavalet till Nordisk klubb vid start och är endast avsedd för utveckling.

`npm test` testar alla 1 800 hål, reproducerbarhet, vind, terräng, pliktslag, lättnad, avslutad rond och validering av sparade data. Webbläsartesterna kör mot faktisk WordPress/PHP, sparar admininställningar och kontrollerar frontend, mobilvy och återupptagning.

## Omfattning

Spelet har 18-hålsrundor, 100 reproducerbara banvarianter, fem klubbor, vind, förenklad fysik, scorekort och lokal sparning. Det är en första spelbar 2D-version. Detaljerade banmiljöer ritas proceduriellt och är inte fotorealistiska 3D-miljöer. Temabytet ändrar spelmiljön och gränssnittet, inte rondens resultat. Pågående rundor sparas per sida och shortcode-instans i webbläsaren, utan inloggning eller serverbaserad topplista.

Regelstödet är förenklat. Spelet räknar slag och pliktslag och erbjuder förenklad lättnad vid röda pliktområden. Det är inte en fullständig implementation av Svenska Golfförbundets regler och rundorna är inte handicapgrundande. Se regelhjälpen i spelet och `readme.txt` för begränsningar.

Alla ljud genereras lokalt genom Web Audio. Ljud aktiveras genom ett uttryckligt knapptryck. Ingen upphovsrättsskyddad musik eller tredjepartsspårning ingår.

## Filer

- `golf-fun.php`: WordPress-hookar, kortkod, säker inställningshantering och behörighetskontroll.
- `includes/`: spelvy och adminvy.
- `assets/engine.js`: deterministisk ban- och spelmotor utan DOM-beroenden.
- `assets/renderer.js`, `game.js`, `audio.js`: ritning, interaktion och ljud.
- `assets/admin.*`, `game.css`, `preview-*.svg`: gränssnitt och egna vektorförhandsvisningar.
- `scripts/`: lokal WordPress, testinnehåll och ZIP-paketering.

Bygg ZIP-filen med `npm run package`. Endast pluginfiler inkluderas; utvecklingsberoenden, testdata och skärmbilder följer inte med.

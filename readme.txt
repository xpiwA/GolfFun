=== GolfFun ===
Requires at least: 6.5
Tested up to: 6.8.3
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Svenskt golfspel med två signaturteman, 18 hål per runda och 100 banvarianter.

== Installation ==
1. Ladda upp golffun-1.0.0.zip via Tillägg > Lägg till nytt > Ladda upp tillägg.
2. Aktivera GolfFun.
3. Öppna GolfFun i WordPress-admin, välj Nordisk klubb eller Skog och sjö och spara.
4. Lägg kortkoden [golffun] i ett kortkodsblock på valfri sida.

Spelet kräver en modern webbläsare med JavaScript, Canvas och ES-moduler.
Använd gärna sidmallen Full bredd i ditt WordPress-tema.

== Funktioner ==
* Två teman som kan bytas i en egen adminpanel.
* 100 deterministiska banvarianter, med 18 hål och par 72 per runda.
* Fem klubbor, riktning, slagstyrka, vind och animerad bollflykt.
* Ruff, fairway, green, bunker, röda pliktområden och out of bounds.
* Scorekort och lokal återupptagning av rond på samma enhet och sida.
* Genererad ambientmusik och vindljud, inga externa ljudfiler.
* Responsiv vy och tangentbordsstyrning.

== Regler och begränsningar ==
Detta är en förenklad 2D-golfsimulator. Slagspel, pliktslag för out of bounds
och förenklad lättnad vid röda pliktområden ingår. Hela det officiella
regelverket implementeras inte. Lättnad väljs automatiskt nära senaste
gränspassagen, aldrig närmare hålet, utan en fysisk droppningsprocedur.
Spelet saknar bland annat handicap, provisorisk boll, ospelbar boll och
alternativet att spela bollen som den ligger i vatten.
Rundor är inte handicapgrundande. Ingen serverbaserad topplista ingår.
Träd är dekorativa; terräng, flykt och rullning är förenklade.

== Integritet ==
Ronden och spelarens ljudval sparas i localStorage när webbläsaren tillåter det.
Inget konto krävs och speldata skickas inte till någon server av pluginet.
Ronden är knuten till sidans sökväg och shortcode-instansens ordning.
Webbläsardata raderas inte av WordPress-avinstallationen.
Inga externa typsnitt, analysverktyg eller musiktjänster används.

== Changelog ==
= 1.0.0 =
Första spelbara versionen med Nordisk klubb och Skog och sjö.

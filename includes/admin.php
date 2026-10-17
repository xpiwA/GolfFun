<?php if (!defined('ABSPATH')) { exit; } ?>
<div class="wrap gf-admin">
    <header class="gfa-topbar">
        <a class="gfa-brand" href="<?php echo esc_url(admin_url('admin.php?page=golffun')); ?>"><span class="gfa-mark" aria-hidden="true">⚑</span> GolfFun<span class="gfa-studio">STUDIO</span></a>
        <span class="gfa-version">WORDPRESS PLUGIN <b>v<?php echo esc_html(GolfFun_Plugin::VERSION); ?></b></span>
    </header>
    <form method="post" action="options.php" id="golffun-settings">
        <?php settings_fields('golffun'); ?>
        <div class="gfa-heading"><div><span class="gfa-eyebrow">DITT SPEL. DIN KÄNSLA.</span><h1>En riktigt bra runda börjar här.</h1><p>Skapa en golfupplevelse som passar din webbplats. Vi tar hand om resten.</p></div><button class="gfa-save" type="submit">Spara ändringar <svg class="gf-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></button></div>
        <?php settings_errors(); ?>
        <div class="gfa-layout">
            <main>
                <section class="gfa-panel gfa-theme-panel" aria-labelledby="gfa-themes">
                    <div class="gfa-section-title"><div><span class="gfa-step">01</span><h2 id="gfa-themes">Välj din spelvärld</h2></div><span class="gfa-tag">TVÅ SIGNATURTEMAN</span></div>
                    <p class="gfa-section-desc">Samma golfspel. Två helt olika platser att längta till.</p>
                    <div class="gfa-themes">
                        <?php foreach (array('nordic' => array('Nordisk klubb', 'Ljust, luftigt och skandinaviskt.', 'NORDISK ELEGANS', 'preview-nordic.svg'), 'forest' => array('Skog och sjö', 'Skogens lugn. Sjöns speglingar.', 'NÄRA NATUREN', 'preview-forest.svg')) as $key => $theme) : ?>
                        <label class="gfa-theme">
                            <input type="radio" name="golffun_settings[theme]" value="<?php echo esc_attr($key); ?>" <?php checked($settings['theme'], $key); ?>>
                            <span class="gfa-theme-box">
                                <span class="gfa-theme-image"><img src="<?php echo esc_url(plugins_url('../assets/' . $theme[3], __FILE__)); ?>" alt="Förhandsvisning av <?php echo esc_attr($theme[0]); ?>"><span class="gfa-preview-label"><?php echo esc_html($theme[2]); ?></span><span class="gfa-selected">✓ Valt tema</span></span>
                                <span class="gfa-theme-copy"><span><strong><?php echo esc_html($theme[0]); ?></strong><small><?php echo esc_html($theme[1]); ?></small></span><span class="gfa-radio" aria-hidden="true"></span></span>
                                <span class="gfa-swatches <?php echo esc_attr($key); ?>" aria-hidden="true"><i></i><i></i><i></i><span><?php echo $key === 'nordic' ? 'Salvia · Granit · Kritvitt' : 'Tall · Sand · Sjöblått'; ?></span></span>
                            </span>
                        </label>
                        <?php endforeach; ?>
                    </div>
                    <div class="gfa-note"><span aria-hidden="true">↻</span> Temat används på alla sidor där du har lagt in GolfFun. Pågående rundor sparas i spelarens webbläsare.</div>
                </section>
                <section class="gfa-panel gfa-audio" aria-labelledby="gfa-sound">
                    <div class="gfa-section-title"><div><span class="gfa-step">02</span><h2 id="gfa-sound">Ljudbild & stämning</h2></div><span class="gfa-tag">SPELAREN HAR KONTROLLEN</span></div>
                    <label class="gfa-setting"><span class="gfa-setting-icon" aria-hidden="true">♫</span><span><strong>Lugn golfmusik</strong><small>Mjuka, genererade toner som följer med genom rundan.</small></span><span class="gfa-switch"><input type="checkbox" name="golffun_settings[music]" value="1" <?php checked($settings['music'], 1); ?>><span></span></span></label>
                    <label class="gfa-setting"><span class="gfa-setting-icon" aria-hidden="true">≋</span><span><strong>Vind & naturljud</strong><small>En vindmatta som anpassas efter vindstyrkan på hålet.</small></span><span class="gfa-switch"><input type="checkbox" name="golffun_settings[weather]" value="1" <?php checked($settings['weather'], 1); ?>><span></span></span></label>
                    <p class="gfa-footnote">Ljud startar först efter att spelaren trycker på ”Aktivera ljud”. Spelaren kan sedan ändra ljudvalen själv.</p>
                </section>
            </main>
            <aside class="gfa-sidebar">
                <section class="gfa-publish"><span class="gfa-eyebrow">REDO FÖR FÖRSTA UTSLAGET?</span><h2>Ta spelet<br>till din webbplats.</h2><p>Lägg ett kortkodsblock på valfri sida och klistra in koden nedan.</p><div class="gfa-shortcode"><code>[golffun]</code><button type="button" data-gf-copy aria-label="Kopiera kortkoden">Kopiera <span aria-hidden="true">▣</span></button></div><span class="gfa-copy-status" aria-live="polite"></span><a href="<?php echo esc_url(admin_url('post-new.php?post_type=page')); ?>" class="gfa-page-link">Skapa en spelsida <svg class="gf-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></a><p class="gfa-publish-tip">Tips: välj sidmallen ”Full bredd” om ditt WordPress-tema har en sådan.</p></section>
                <section class="gfa-panel gfa-details"><span class="gfa-eyebrow">BYGGT FÖR EN HEL RUNDA</span><div><b>18</b><span>hål per runda</span></div><div><b>100</b><span>banvarianter att upptäcka</span></div><div><b>2</b><span>utvalda designvärldar</span></div><p>✓ Mobil, surfplatta & dator<br>✓ Ronden sparas i webbläsaren<br>✓ Inget konto krävs för att spela</p></section>
                <div class="gfa-rule-note"><strong>Spela med koll på reglerna.</strong><p>Förenklat slagspel med pliktslag och lättnad. Regelhjälp finns i spelet. Rundorna är inte handicapgrundande.</p></div>
            </aside>
        </div>
        <footer class="gfa-footer"><span>GolfFun <span aria-hidden="true">·</span> Lite närmare nästa birdie.</span><span data-gf-dirty role="status">Alla ändringar sparas med knappen ovan.</span><button class="gfa-save" type="submit">Spara ändringar <svg class="gf-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg></button></footer>
    </form>
</div>

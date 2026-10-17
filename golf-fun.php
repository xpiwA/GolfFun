<?php
/**
 * Plugin Name: GolfFun
 * Description: Ett svenskt golfspel med 18 hål, 100 banvarianter och två omsorgsfullt formgivna teman.
 * Version: 1.0.0
 * Requires at least: 6.5
 * Requires PHP: 7.4
 * Author: GolfFun
 * Text Domain: golffun
 * License: GPL-2.0-or-later
 */

if (!defined('ABSPATH')) {
    exit;
}

final class GolfFun_Plugin {
    const VERSION = '1.0.0';
    const OPTION = 'golffun_settings';

    public static function boot() {
        add_action('init', array(__CLASS__, 'register_assets'));
        add_action('admin_menu', array(__CLASS__, 'admin_menu'));
        add_action('admin_init', array(__CLASS__, 'register_settings'));
        add_action('admin_enqueue_scripts', array(__CLASS__, 'admin_assets'));
        add_shortcode('golffun', array(__CLASS__, 'shortcode'));
        add_filter('script_loader_tag', array(__CLASS__, 'module_tag'), 10, 3);
        add_filter('plugin_action_links_' . plugin_basename(__FILE__), array(__CLASS__, 'action_links'));
    }

    public static function settings() {
        $value = get_option(self::OPTION, array());
        return wp_parse_args(is_array($value) ? $value : array(), array(
            'theme' => 'nordic', 'music' => 0, 'weather' => 1,
        ));
    }

    public static function register_assets() {
        wp_register_style('golffun-game', plugins_url('assets/game.css', __FILE__), array(), self::VERSION);
        wp_register_script('golffun-game', plugins_url('assets/game.js', __FILE__), array(), self::VERSION, true);
    }

    public static function module_tag($tag, $handle, $src) {
        if ($handle === 'golffun-game') {
            return '<script type="module" src="' . esc_url($src) . '" id="golffun-game-js"></script>';
        }
        return $tag;
    }

    public static function register_settings() {
        register_setting('golffun', self::OPTION, array(
            'type' => 'array',
            'sanitize_callback' => array(__CLASS__, 'sanitize'),
            'default' => array('theme' => 'nordic', 'music' => 0, 'weather' => 1),
        ));
    }

    public static function sanitize($input) {
        $input = is_array($input) ? $input : array();
        return array(
            'theme' => isset($input['theme']) && $input['theme'] === 'forest' ? 'forest' : 'nordic',
            'music' => empty($input['music']) ? 0 : 1,
            'weather' => empty($input['weather']) ? 0 : 1,
        );
    }

    public static function admin_menu() {
        add_menu_page('GolfFun', 'GolfFun', 'manage_options', 'golffun', array(__CLASS__, 'admin_page'), 'dashicons-flag', 58);
    }

    public static function admin_assets($hook) {
        if ($hook !== 'toplevel_page_golffun') {
            return;
        }
        wp_enqueue_style('golffun-admin', plugins_url('assets/admin.css', __FILE__), array(), self::VERSION);
        wp_enqueue_script('golffun-admin', plugins_url('assets/admin.js', __FILE__), array(), self::VERSION, true);
    }

    public static function admin_page() {
        if (!current_user_can('manage_options')) {
            return;
        }
        $settings = self::settings();
        include __DIR__ . '/includes/admin.php';
    }

    public static function shortcode() {
        wp_enqueue_style('golffun-game');
        wp_enqueue_script('golffun-game');
        $settings = self::settings();
        $instance = wp_unique_id('golffun-');
        $config = array('theme' => $settings['theme'] === 'forest' ? 'forest' : 'nordic',
            'music' => (bool) $settings['music'], 'weather' => (bool) $settings['weather']);
        ob_start();
        include __DIR__ . '/includes/game.php';
        return ob_get_clean();
    }

    public static function action_links($links) {
        array_unshift($links, '<a href="' . esc_url(admin_url('admin.php?page=golffun')) . '">Inställningar</a>');
        return $links;
    }
}

GolfFun_Plugin::boot();

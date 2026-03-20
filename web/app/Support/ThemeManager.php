<?php

declare(strict_types=1);

namespace App\Support;

use App\Enums\ThemeId;

final class ThemeManager
{
    /**
     * @return array<string, array<string, array<string, string>>>
     */
    public static function palettes(): array
    {
        return config('themes.palettes', []);
    }

    public static function default(): string
    {
        return config('themes.default', ThemeId::PIXELS->value);
    }

    /**
     * @return array<int, string>
     */
    public static function available(): array
    {
        return array_keys(self::palettes());
    }

    /**
     * @param string|null $themeId
     *
     * @return array{
     *     id: string,
     *     name: string,
     *     colors: array<string, string>
     * }
     */
    public static function definition(?string $themeId): array
    {
        $id = $themeId ?: self::default();
        $palettes = self::palettes();
        $definition = $palettes[$id] ?? $palettes[self::default()] ?? [];
        return [
            'id' => $id,
            'name' => $definition['name'] ?? self::formatName($id),
            'colors' => $definition['colors'] ?? [],
        ];
    }

    /**
     * @return array<int, array{id: string, name: string, colors: array<string, string>}>
     */
    public static function all(): array
    {
        $palettes = self::palettes();
        $themes = [];

        foreach ($palettes as $id => $definition) {
            $themes[] = [
                'id' => $id,
                'name' => $definition['name'] ?? self::formatName($id),
                'colors' => $definition['colors'] ?? [],
            ];
        }

        return $themes;
    }

    private static function formatName(string $id): string
    {
        $formatted = str_replace('-', ' ', $id);
        return ucfirst($formatted);
    }
}

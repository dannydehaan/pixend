<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('variables', function (Blueprint $table) {
            $table->id();
            $table->string('key');
            $table->text('encrypted_value');
            $table->string('variableable_type');
            $table->unsignedBigInteger('variableable_id');
            $table->timestamps();
            $table->unique(['variableable_type', 'variableable_id', 'key']);
            $table->index(['variableable_type', 'variableable_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('variables');
    }
};

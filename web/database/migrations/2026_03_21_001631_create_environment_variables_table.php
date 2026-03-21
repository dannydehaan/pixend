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
        Schema::create('environment_variables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('environment_id')->nullable()->constrained('environments')->cascadeOnDelete();
            $table->foreignId('collection_id')->nullable()->constrained('collections')->cascadeOnDelete();
            $table->string('key');
            $table->text('encrypted_value');
            $table->boolean('sensitive')->default(true);
            $table->string('description')->nullable();
            $table->timestamps();
            $table->unique(['environment_id', 'key']);
            $table->index(['collection_id', 'key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('environment_variables');
    }
};

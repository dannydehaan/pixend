<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $defaultTypeId = DB::table('workspace_types')->where('slug', 'standard')->value('id') ?? 1;

        Schema::table('workspaces', function (Blueprint $table) use ($defaultTypeId) {
            $table->foreignId('workspace_type_id')->after('slug')->default($defaultTypeId)->constrained('workspace_types')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropConstrainedForeignId('workspace_type_id');
        });
    }
};

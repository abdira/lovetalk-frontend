<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('counselor_availabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('counselor_id')->constrained('users')->onDelete('cascade');
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_available')->default(true);
            $table->string('reason')->nullable(); // if not available
            $table->timestamps();

            $table->unique(['counselor_id', 'date', 'start_time']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('counselor_availabilities');
    }
};

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Emit.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSemestreToDisponibilites : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Disponibilites_EnseignantId",
                table: "Disponibilites");

            migrationBuilder.AddColumn<Guid>(
                name: "SemestreId",
                table: "Disponibilites",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Disponibilites_EnseignantId_SemestreId_Jour_Creneau",
                table: "Disponibilites",
                columns: new[] { "EnseignantId", "SemestreId", "Jour", "Creneau" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Disponibilites_SemestreId",
                table: "Disponibilites",
                column: "SemestreId");

            migrationBuilder.AddForeignKey(
                name: "FK_Disponibilites_Semestres_SemestreId",
                table: "Disponibilites",
                column: "SemestreId",
                principalTable: "Semestres",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Disponibilites_Semestres_SemestreId",
                table: "Disponibilites");

            migrationBuilder.DropIndex(
                name: "IX_Disponibilites_EnseignantId_SemestreId_Jour_Creneau",
                table: "Disponibilites");

            migrationBuilder.DropIndex(
                name: "IX_Disponibilites_SemestreId",
                table: "Disponibilites");

            migrationBuilder.DropColumn(
                name: "SemestreId",
                table: "Disponibilites");

            migrationBuilder.CreateIndex(
                name: "IX_Disponibilites_EnseignantId",
                table: "Disponibilites",
                column: "EnseignantId");
        }
    }
}

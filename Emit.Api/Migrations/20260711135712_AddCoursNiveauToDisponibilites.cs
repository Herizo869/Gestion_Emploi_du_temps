using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Emit.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCoursNiveauToDisponibilites : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Disponibilites_EnseignantId_SemestreId_Jour_Creneau",
                table: "Disponibilites");

            migrationBuilder.AddColumn<Guid>(
                name: "CoursId",
                table: "Disponibilites",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "NiveauId",
                table: "Disponibilites",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Disponibilites_CoursId",
                table: "Disponibilites",
                column: "CoursId");

            migrationBuilder.CreateIndex(
                name: "IX_Disponibilites_EnseignantId_SemestreId_CoursId_Jour_Creneau",
                table: "Disponibilites",
                columns: new[] { "EnseignantId", "SemestreId", "CoursId", "Jour", "Creneau" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Disponibilites_NiveauId",
                table: "Disponibilites",
                column: "NiveauId");

            migrationBuilder.AddForeignKey(
                name: "FK_Disponibilites_Cours_CoursId",
                table: "Disponibilites",
                column: "CoursId",
                principalTable: "Cours",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Disponibilites_Niveaux_NiveauId",
                table: "Disponibilites",
                column: "NiveauId",
                principalTable: "Niveaux",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Disponibilites_Cours_CoursId",
                table: "Disponibilites");

            migrationBuilder.DropForeignKey(
                name: "FK_Disponibilites_Niveaux_NiveauId",
                table: "Disponibilites");

            migrationBuilder.DropIndex(
                name: "IX_Disponibilites_CoursId",
                table: "Disponibilites");

            migrationBuilder.DropIndex(
                name: "IX_Disponibilites_EnseignantId_SemestreId_CoursId_Jour_Creneau",
                table: "Disponibilites");

            migrationBuilder.DropIndex(
                name: "IX_Disponibilites_NiveauId",
                table: "Disponibilites");

            migrationBuilder.DropColumn(
                name: "CoursId",
                table: "Disponibilites");

            migrationBuilder.DropColumn(
                name: "NiveauId",
                table: "Disponibilites");

            migrationBuilder.CreateIndex(
                name: "IX_Disponibilites_EnseignantId_SemestreId_Jour_Creneau",
                table: "Disponibilites",
                columns: new[] { "EnseignantId", "SemestreId", "Jour", "Creneau" },
                unique: true);
        }
    }
}

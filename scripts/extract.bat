@echo off

for %%T in (NKJV, ESV) do (
    echo %%T
    python extract.py "%cd%\data\%%T\source" "%cd%\data\%%T\%%T"
    xcopy "%cd%\data\%%T\%%T" "%USERPROFILE%\bible-app\Scripture\%%T" /E /Y

    for %%E in (GEN.1, GEN.2, MAT.5, DEU.28) do (
        xcopy "%cd%\data\%%T\%%T\%%E" "%cd%\..\example\Scripture\%%T" /Y /I
    )
)

pause